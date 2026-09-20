import os
import logging
import httpx
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger("services.dodo")

class DodoPaymentError(Exception):
    """Raised when an error occurs during Dodo Payments API operations."""
    pass


class DodoService:
    """
    Production Dodo Payments Service.
    Interacts with the official Dodo Payments REST API and Standard Webhooks verification.
    Supports both test_mode and live_mode.
    """

    def __init__(self):
        self.api_key = settings.DODO_PAYMENTS_API_KEY or os.getenv("DODO_PAYMENTS_API_KEY", "")
        self.webhook_secret = settings.DODO_PAYMENTS_WEBHOOK_SECRET or os.getenv("DODO_PAYMENTS_WEBHOOK_SECRET", "")
        self.environment = (settings.DODO_PAYMENTS_ENVIRONMENT or os.getenv("DODO_PAYMENTS_ENVIRONMENT", "test_mode")).lower()
        self.product_id = settings.DODO_PAYMENTS_PRODUCT_ID or os.getenv("DODO_PAYMENTS_PRODUCT_ID", "pdt_regulation_compiler_pro")
        self.default_return_url = settings.DODO_PAYMENTS_RETURN_URL or os.getenv("DODO_PAYMENTS_RETURN_URL", "http://localhost:3000/billing/success")

        # Select Dodo Payments API Base URL based on environment
        if self.environment == "live_mode":
            self.base_url = "https://live.dodopayments.com"
        else:
            self.base_url = "https://test.dodopayments.com"

    def is_configured(self) -> bool:
        """Returns True if Dodo Payments API Key is configured."""
        return bool(self.api_key and not self.api_key.startswith("placeholder"))

    async def create_checkout_session(
        self,
        user_id: str,
        org_id: str,
        user_email: str,
        user_name: Optional[str] = None,
        product_id: Optional[str] = None,
        return_url: Optional[str] = None,
        custom_metadata: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Creates an authentic Dodo Payments checkout session for unlocking continued usage.
        Returns the checkout URL and session identifiers.
        """
        target_product_id = product_id or self.product_id
        target_return_url = return_url or self.default_return_url

        metadata = {
            "user_id": str(user_id),
            "org_id": str(org_id),
            "tier": "pro",
            **(custom_metadata or {})
        }

        # If real API key is configured, invoke Dodo Payments Checkout API
        if self.is_configured():
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "User-Agent": "RegulationCompiler-Billing/1.0"
            }
            payload = {
                "product_cart": [
                    {
                        "product_id": target_product_id,
                        "quantity": 1
                    }
                ],
                "customer": {
                    "email": user_email,
                    "name": user_name or user_email.split('@')[0]
                },
                "return_url": target_return_url,
                "metadata": metadata
            }

            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(
                        f"{self.base_url}/checkout_sessions",
                        headers=headers,
                        json=payload
                    )
                    if resp.status_code in (200, 201):
                        data = resp.json()
                        logger.info(f"Dodo Payments checkout session created successfully for org {org_id}")
                        return {
                            "checkout_url": data.get("checkout_url"),
                            "session_id": data.get("session_id"),
                            "customer_id": data.get("customer_id")
                        }
                    else:
                        err_msg = f"Dodo Payments API returned HTTP {resp.status_code}: {resp.text}"
                        logger.error(err_msg)
                        raise DodoPaymentError(err_msg)
            except httpx.RequestError as req_err:
                logger.error(f"Network error connecting to Dodo Payments: {req_err}")
                raise DodoPaymentError(f"Could not reach Dodo Payments gateway: {req_err}")

        # When API key is not yet set in development/test mode, provide a valid structured response pointing to the return URL or test checkout
        logger.warning("DODO_PAYMENTS_API_KEY is not configured. Falling back to test checkout redirect.")
        fallback_checkout_url = f"{self.base_url}/buy/{target_product_id}?return_url={target_return_url}&email={user_email}"
        return {
            "checkout_url": fallback_checkout_url,
            "session_id": f"sess_test_{org_id}",
            "customer_id": f"cus_test_{user_id}",
            "mode": "test_mode_unconfigured"
        }

    def verify_webhook_signature(
        self,
        raw_body: bytes,
        headers: Dict[str, str]
    ) -> Dict[str, Any]:
        """
        Cryptographically verifies incoming Dodo Payments webhook signatures using Standard Webhooks (Svix).
        Extracts and validates: webhook-id, webhook-signature, webhook-timestamp.
        """
        import json

        # Normalize header keys to lowercase
        norm_headers = {k.lower(): v for k, v in headers.items()}
        webhook_id = norm_headers.get("webhook-id")
        webhook_sig = norm_headers.get("webhook-signature")
        webhook_ts = norm_headers.get("webhook-timestamp")

        if not webhook_id or not webhook_sig or not webhook_ts:
            raise DodoPaymentError("Missing standard webhook security headers (webhook-id, webhook-signature, webhook-timestamp)")

        # Verify signature using Svix/StandardWebhooks
        secret = self.webhook_secret
        if secret and not secret.startswith("placeholder"):
            try:
                from svix.webhooks import Webhook
                wh = Webhook(secret)
                verified_payload = wh.verify(raw_body, {
                    "webhook-id": webhook_id,
                    "webhook-signature": webhook_sig,
                    "webhook-timestamp": webhook_ts
                })
                logger.info(f"Dodo Payments webhook signature verified successfully for event {webhook_id}")
                return verified_payload
            except Exception as e:
                logger.error(f"Webhook signature verification failed: {e}")
                raise DodoPaymentError(f"Invalid webhook signature: {e}")

        # If webhook secret is not set, parse payload with strict warning
        logger.warning("DODO_PAYMENTS_WEBHOOK_SECRET is not configured. Processing payload without cryptographic verification.")
        try:
            return json.loads(raw_body.decode("utf-8"))
        except Exception as e:
            raise DodoPaymentError(f"Invalid JSON webhook payload: {e}")

    async def get_customer_portal_url(self, customer_id: str) -> Optional[str]:
        """Generates a customer billing portal URL for managing payment methods and subscriptions."""
        if not self.is_configured() or not customer_id:
            return None

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    f"{self.base_url}/customers/{customer_id}/customer_portal",
                    headers=headers
                )
                if resp.status_code == 200:
                    return resp.json().get("portal_url")
        except Exception as ex:
            logger.warning(f"Could not generate customer portal session: {ex}")
        return None


dodo_service = DodoService()
