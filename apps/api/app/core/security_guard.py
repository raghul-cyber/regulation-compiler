import re
import os
import json
import logging
import urllib.parse
import asyncio
from typing import Callable, Optional
from starlette.types import ASGIApp, Scope, Receive, Send
from starlette.responses import JSONResponse

logger = logging.getLogger("security.guard")

# Compiled regex for detecting common SQL Injection signatures
SQLI_PATTERNS = [
    re.compile(r"(\bUNION\b\s+(\bALL\b\s+)?\bSELECT\b)", re.IGNORECASE),
    re.compile(r"(\bOR\b\s+['\"]?\w+['\"]?\s*=\s*['\"]?\w+['\"]?)", re.IGNORECASE),
    re.compile(r"(\bAND\b\s+['\"]?\w+['\"]?\s*=\s*['\"]?\w+['\"]?)", re.IGNORECASE),
    re.compile(r"(;\s*\bDROP\b\s+\bTABLE\b)", re.IGNORECASE),
    re.compile(r"(;\s*\bDELETE\b\s+\bFROM\b)", re.IGNORECASE),
    re.compile(r"(;\s*\bINSERT\b\s+\bINTO\b)", re.IGNORECASE),
    re.compile(r"(;\s*\bUPDATE\b\s+.*\bSET\b)", re.IGNORECASE),
    re.compile(r"(\bEXEC\b\s*\(|\bxp_cmdshell\b)", re.IGNORECASE),
    re.compile(r"(--|/\*|\*/)", re.IGNORECASE),
]

# Max upload limit in bytes (25MB)
MAX_UPLOAD_SIZE = 25 * 1024 * 1024


def sanitize_filename(filename: str) -> str:
    """
    Strips directory traversal sequences (../, ..\\) and ensures filename
    contains only safe alphanumeric characters, dashes, underscores, and dots.
    """
    clean_name = os.path.basename(filename)
    clean_name = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", clean_name)
    clean_name = clean_name.lstrip("._")
    return clean_name or "uploaded_document"


def validate_file_magic_bytes(file_bytes: bytes, declared_extension: str) -> bool:
    """
    Validates magic bytes for uploaded files to guarantee against executable
    files disguised as PDFs or documents.
    """
    ext = declared_extension.lower().lstrip(".")
    if ext == "pdf":
        return file_bytes.startswith(b"%PDF-")
    elif ext in ["htm", "html"]:
        # Disallow executable headers like Windows PE (MZ) or Linux ELF (\x7fELF)
        if file_bytes.startswith(b"MZ") or file_bytes.startswith(b"\x7fELF"):
            return False
        sample = file_bytes[:1024].lower()
        return (b"<!doctype html" in sample or b"<html" in sample or b"<body" in sample or b"<head" in sample)
    return True


def check_for_sqli(text: str) -> Optional[str]:
    """
    Scans a string value for dangerous SQL injection patterns.
    Returns matching signature or None.
    """
    if not text or len(text) < 2:
        return None
    for pattern in SQLI_PATTERNS:
        match = pattern.search(text)
        if match:
            return match.group(0)
    return None


class SQLInjectionGuardMiddleware:
    """
    Pure ASGI Middleware that inspects URL query strings and paths for SQL injection attempts.
    Halts malicious requests with HTTP 400 Bad Request and logs an audit security event.
    """
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        # 1. Inspect query parameters (raw and decoded)
        raw_query = scope.get("query_string", b"").decode("utf-8", errors="ignore")
        unquoted_query = urllib.parse.unquote_plus(raw_query)
        detected = check_for_sqli(unquoted_query) or check_for_sqli(raw_query)

        # 2. Inspect path (raw and decoded)
        if not detected:
            raw_path = scope.get("path", "")
            unquoted_path = urllib.parse.unquote_plus(raw_path)
            detected = check_for_sqli(unquoted_path) or check_for_sqli(raw_path)

        if detected:
            client = scope.get("client")
            client_ip = client[0] if client else "unknown"
            logger.critical(
                f"[SECURITY ALERT: SQLi Detected] Client: {client_ip} "
                f"Path: {scope.get('path')} Signature: {detected}"
            )
            response = JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": {
                        "code": "MALICIOUS_INPUT_DETECTED",
                        "message": "Potential SQL Injection sequence detected in request parameters.",
                        "details": {"pattern": detected}
                    }
                }
            )
            return await response(scope, receive, send)

        await self.app(scope, receive, send)


class SecurityHeadersMiddleware:
    """
    Pure ASGI Middleware enforcing strict enterprise security headers on all responses:
    - Content-Security-Policy (CSP)
    - Strict-Transport-Security (HSTS)
    - X-Frame-Options: DENY (anti-clickjacking)
    - X-Content-Type-Options: nosniff
    - X-XSS-Protection: 1; mode=block
    - Referrer-Policy: strict-origin-when-cross-origin
    - Permissions-Policy
    """
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        async def send_with_headers(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                extra_headers = [
                    (b"x-content-type-options", b"nosniff"),
                    (b"x-frame-options", b"DENY"),
                    (b"x-xss-protection", b"1; mode=block"),
                    (b"strict-transport-security", b"max-age=31536000; includeSubDomains; preload"),
                    (b"referrer-policy", b"strict-origin-when-cross-origin"),
                    (b"permissions-policy", b"camera=(), microphone=(), geolocation=(), payment=()"),
                    (b"content-security-policy", b"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; frame-ancestors 'none'; object-src 'none'; base-uri 'self';"),
                ]
                headers.extend(extra_headers)
                message["headers"] = headers
            await send(message)

        await self.app(scope, receive, send_with_headers)


class UploadSizeLimitMiddleware:
    """
    Pure ASGI Middleware enforcing maximum payload size check before reading large request bodies.
    Returns 413 Payload Too Large if Content-Length exceeds threshold.
    """
    def __init__(self, app: ASGIApp, max_upload_size: int = MAX_UPLOAD_SIZE):
        self.app = app
        self.max_upload_size = max_upload_size

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http":
            for header_name, header_val in scope.get("headers", []):
                if header_name.lower() == b"content-length":
                    try:
                        length = int(header_val.decode("latin1"))
                        if length > self.max_upload_size:
                            response = JSONResponse(
                                status_code=413,
                                content={
                                    "success": False,
                                    "error": {
                                        "code": "PAYLOAD_TOO_LARGE",
                                        "message": f"Upload size exceeds maximum allowed limit of {self.max_upload_size // (1024*1024)}MB.",
                                        "details": {"size_bytes": length, "max_allowed_bytes": self.max_upload_size}
                                    }
                                }
                            )
                            return await response(scope, receive, send)
                    except ValueError:
                        pass
        await self.app(scope, receive, send)


class RequestTimeoutMiddleware:
    """
    Pure ASGI Middleware guaranteeing no request hangs indefinitely on the server.
    Cancels execution and returns 504 Gateway Timeout if execution exceeds timeout.
    """
    def __init__(self, app: ASGIApp, timeout_seconds: float = 60.0):
        self.app = app
        self.timeout_seconds = timeout_seconds

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        path = scope.get("path", "")
        # Skip streaming endpoints
        if path.endswith("/events") or "stream" in path:
            return await self.app(scope, receive, send)

        try:
            async with asyncio.timeout(self.timeout_seconds):
                await self.app(scope, receive, send)
        except (asyncio.TimeoutError, TimeoutError):
            logger.error(f"Request timeout exceeded ({self.timeout_seconds}s) for {path}")
            response = JSONResponse(
                status_code=504,
                content={
                    "success": False,
                    "error": {
                        "code": "REQUEST_TIMEOUT",
                        "message": f"Request processing timed out after {self.timeout_seconds} seconds.",
                        "details": {"path": path}
                    }
                }
            )
            try:
                await response(scope, receive, send)
            except Exception:
                pass
