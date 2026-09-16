import time
import json
import functools
import logging
from typing import Any, Callable, Dict, Optional, Tuple

logger = logging.getLogger("core.cache")

import threading
from collections import OrderedDict

MAX_CACHE_ENTRIES = 500

class BoundedTTLCache:
    """
    Thread-safe bounded in-memory cache with TTL expiration and LRU eviction.
    Enforces a strict upper ceiling on stored entries to prevent memory leaks.
    """
    def __init__(self, maxsize: int = MAX_CACHE_ENTRIES):
        self.maxsize = maxsize
        self._store: OrderedDict[str, Tuple[Any, float]] = OrderedDict()
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        now = time.time()
        with self._lock:
            if key not in self._store:
                return None
            val, expiry = self._store[key]
            if now > expiry:
                del self._store[key]
                return None
            self._store.move_to_end(key)
            return val

    def set(self, key: str, value: Any, ttl_seconds: int = 300):
        now = time.time()
        expiry = now + ttl_seconds
        with self._lock:
            # 1. Proactively purge expired entries if approaching capacity
            if len(self._store) >= self.maxsize:
                expired = [k for k, (_, exp) in self._store.items() if now > exp]
                for k in expired:
                    del self._store[k]
            # 2. Enforce strict LRU ceiling
            while len(self._store) >= self.maxsize:
                self._store.popitem(last=False)
            self._store[key] = (value, expiry)
            self._store.move_to_end(key)

    def invalidate(self, prefix: str):
        with self._lock:
            matching = [k for k in self._store.keys() if k.startswith(prefix)]
            for k in matching:
                self._store.pop(k, None)
            if matching:
                logger.info(f"Invalidated {len(matching)} cache entries with prefix: {prefix}")

    def clear(self):
        with self._lock:
            self._store.clear()

    def __len__(self):
        with self._lock:
            return len(self._store)

_cache_instance = BoundedTTLCache(maxsize=MAX_CACHE_ENTRIES)


class ResponseCache:
    """
    High-speed caching layer for repeat and read-heavy queries.
    Supports TTL expiration, instant cache invalidation, and custom cache keys.
    """

    @classmethod
    def get(cls, key: str) -> Optional[Any]:
        return _cache_instance.get(key)

    @classmethod
    def set(cls, key: str, value: Any, ttl_seconds: int = 300):
        _cache_instance.set(key, value, ttl_seconds)

    @classmethod
    def invalidate(cls, prefix: str):
        _cache_instance.invalidate(prefix)


def cached_endpoint(ttl_seconds: int = 300, key_prefix: str = ""):
    """
    Decorator for caching endpoint responses.
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Compute cache key from function name + kwargs
            clean_kwargs = {k: v for k, v in kwargs.items() if k not in ["db", "current_user", "request"]}
            cache_key = f"{key_prefix or func.__name__}:{json.dumps(clean_kwargs, sort_keys=True, default=str)}"
            
            cached_val = ResponseCache.get(cache_key)
            if cached_val is not None:
                return cached_val

            result = await func(*args, **kwargs) if functools.iscoroutinefunction(func) else func(*args, **kwargs)
            ResponseCache.set(cache_key, result, ttl_seconds)
            return result

        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            clean_kwargs = {k: v for k, v in kwargs.items() if k not in ["db", "current_user", "request"]}
            cache_key = f"{key_prefix or func.__name__}:{json.dumps(clean_kwargs, sort_keys=True, default=str)}"
            
            cached_val = ResponseCache.get(cache_key)
            if cached_val is not None:
                return cached_val

            result = func(*args, **kwargs)
            ResponseCache.set(cache_key, result, ttl_seconds)
            return result

        if functools.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    return decorator
