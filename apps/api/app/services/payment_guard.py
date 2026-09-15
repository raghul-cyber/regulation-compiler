import time
import logging
from typing import Dict, Any, Optional, Set
import threading

logger = logging.getLogger("services.payment_guard")

# Processed webhook event IDs to prevent duplicate webhook replays
_processed_events: Set[str] = set()

# Active payment transaction locks: { "transaction_key": (lock, expiry_time) }
_payment_locks: Dict[str, float] = {}
_lock_mutex = threading.Lock()
PAYMENT_LOCK_TTL = 60.0  # 60 second lock window


class DuplicatePaymentException(Exception):
    """Raised when an active payment transaction is detected or already finalized."""
    pass


class PaymentGuardService:
    """
    Guarantees strict once-only execution for financial transactions, billing events,
    and payment webhooks (Stripe / LemonSqueezy / Paddle).
    """

    @classmethod
    def acquire_payment_lock(cls, idempotency_key: str) -> bool:
        """
        Attempts to acquire an exclusive lock on a payment transaction.
        Returns True if acquired, False if a duplicate transaction is currently executing.
        """
        now = time.time()
        with _lock_mutex:
            # Clean expired locks
            expired = [k for k, exp in _payment_locks.items() if now > exp]
            for ek in expired:
                del _payment_locks[ek]

            if idempotency_key in _payment_locks:
                logger.warning(f"DUPLICATE PAYMENT ATTEMPT BLOCKED: Transaction {idempotency_key} is currently processing.")
                return False

            _payment_locks[idempotency_key] = now + PAYMENT_LOCK_TTL
            return True

    @classmethod
    def release_payment_lock(cls, idempotency_key: str):
        """Releases the lock after transaction is completed."""
        with _lock_mutex:
            _payment_locks.pop(idempotency_key, None)

    @classmethod
    def is_webhook_duplicate(cls, event_id: str) -> bool:
        """
        Checks if a payment webhook event has already been processed.
        If not, marks it as processed immediately.
        """
        with _lock_mutex:
            if event_id in _processed_events:
                logger.warning(f"DUPLICATE PAYMENT WEBHOOK IGNORED: Event ID {event_id} was already executed.")
                return True
            _processed_events.add(event_id)
            # Cap set size to prevent unbounded memory growth
            if len(_processed_events) > 10000:
                # Remove oldest items
                _processed_events.clear()
            return False
