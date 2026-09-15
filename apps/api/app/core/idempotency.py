import time
import json
import logging
from typing import Dict, Tuple
from starlette.types import ASGIApp, Scope, Receive, Send
from starlette.responses import JSONResponse, Response

logger = logging.getLogger("core.idempotency")

# Cache store for idempotency keys: { "key": (status_code, headers_list, body_bytes, timestamp, is_in_flight) }
_idempotency_store: Dict[str, Tuple[int, list, bytes, float, bool]] = {}
IDEMPOTENCY_TTL_SECONDS = 120.0  # 2 minute protection window


class IdempotencyGuardMiddleware:
    """
    Pure ASGI Middleware that intercepts POST, PUT, and PATCH requests containing an
    'X-Idempotency-Key' header to guarantee strict once-and-only-once execution semantics.
    """
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        method = scope.get("method", "GET")
        if method not in ("POST", "PUT", "PATCH"):
            return await self.app(scope, receive, send)

        # Extract X-Idempotency-Key
        idempotency_key = None
        for h_name, h_val in scope.get("headers", []):
            if h_name.lower() == b"x-idempotency-key":
                idempotency_key = h_val.decode("latin1").strip()
                break

        if not idempotency_key:
            return await self.app(scope, receive, send)

        now = time.time()
        # Clean stale keys (> TTL)
        stale_keys = [k for k, v in _idempotency_store.items() if (now - v[3]) > IDEMPOTENCY_TTL_SECONDS]
        for sk in stale_keys:
            _idempotency_store.pop(sk, None)

        record = _idempotency_store.get(idempotency_key)
        if record:
            status_code, headers_list, body_bytes, timestamp, is_in_flight = record
            if is_in_flight:
                logger.warning(f"Concurrent duplicate submission blocked for idempotency key: {idempotency_key}")
                conflict_resp = JSONResponse(
                    status_code=409,
                    content={
                        "success": False,
                        "error": {
                            "code": "DUPLICATE_SUBMISSION_IN_FLIGHT",
                            "message": "A duplicate request with this idempotency key is already currently being processed.",
                            "idempotency_key": idempotency_key
                        }
                    }
                )
                return await conflict_resp(scope, receive, send)

            # Return cached response
            logger.info(f"Serving idempotent cached response for key: {idempotency_key}")
            cached_resp = Response(
                content=body_bytes,
                status_code=status_code,
            )
            # Replay headers except hop-by-hop
            for hk, hv in headers_list:
                hk_lower = hk.lower() if isinstance(hk, bytes) else hk.lower().encode()
                if hk_lower not in (b"content-length", b"content-encoding"):
                    cached_resp.headers[hk.decode("latin1") if isinstance(hk, bytes) else hk] = (
                        hv.decode("latin1") if isinstance(hv, bytes) else hv
                    )
            cached_resp.headers["X-Idempotent-Replay"] = "true"
            return await cached_resp(scope, receive, send)

        # Mark in-flight
        _idempotency_store[idempotency_key] = (0, [], b"", now, True)
        captured_status = 200
        captured_headers = []
        captured_body_chunks = []

        async def idempotency_send(message):
            nonlocal captured_status, captured_headers, captured_body_chunks
            if message["type"] == "http.response.start":
                captured_status = message.get("status", 200)
                captured_headers = message.get("headers", [])
            elif message["type"] == "http.response.body":
                body = message.get("body", b"")
                if body:
                    captured_body_chunks.append(body)
            await send(message)

        try:
            await self.app(scope, receive, idempotency_send)
            if 200 <= captured_status < 400:
                _idempotency_store[idempotency_key] = (
                    captured_status,
                    captured_headers,
                    b"".join(captured_body_chunks),
                    time.time(),
                    False  # completed
                )
            else:
                _idempotency_store.pop(idempotency_key, None)
        except Exception:
            _idempotency_store.pop(idempotency_key, None)
            raise
