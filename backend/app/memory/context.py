"""
InstaTG Agent — Conversation Memory

Maintains per-contact conversation context.
Uses Redis when available, falls back to in-memory dict for demo mode.
"""

import json
import structlog
from datetime import datetime
from typing import Optional
from collections import defaultdict

from app.config import settings

logger = structlog.get_logger(__name__)

MAX_CONTEXT_MESSAGES = 50


class ConversationMemory:
    """Conversation memory manager — Redis or in-memory fallback."""

    def __init__(self):
        self._redis = None
        self._use_redis = False
        self._local_store: dict[str, list] = defaultdict(list)

    async def connect(self) -> None:
        """Try to connect to Redis. Fall back gracefully if unavailable."""
        try:
            import redis.asyncio as aioredis
            self._redis = aioredis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
            )
            await self._redis.ping()
            self._use_redis = True
            logger.info("redis_connected", url=settings.redis_url)
        except Exception as e:
            self._use_redis = False
            self._redis = None
            logger.warning("redis_unavailable_using_memory", reason=str(e))

    async def close(self) -> None:
        """Close Redis connection if active."""
        if self._redis and self._use_redis:
            await self._redis.close()
            logger.info("redis_disconnected")

    @property
    def redis(self):
        return self._redis

    def _key(self, tenant_id: str, contact_id: str) -> str:
        return f"tenant:{tenant_id}:contact:{contact_id}:messages"

    async def add_message(
        self,
        tenant_id: str,
        contact_id: str,
        role: str,
        content: str,
        message_type: str = "text",
        metadata: Optional[dict] = None,
    ) -> None:
        """Add a message to the conversation context."""
        key = self._key(tenant_id, contact_id)
        message = {
            "role": role,
            "content": content,
            "type": message_type,
            "timestamp": datetime.utcnow().isoformat(),
        }
        if metadata:
            message["metadata"] = metadata

        if self._use_redis:
            try:
                pipe = self._redis.pipeline()
                pipe.rpush(key, json.dumps(message))
                pipe.ltrim(key, -MAX_CONTEXT_MESSAGES, -1)
                pipe.expire(key, 86400 * 7)
                await pipe.execute()
            except Exception as e:
                logger.error("redis_add_message_error", error=str(e))
                self._local_store[key].append(message)
                self._local_store[key] = self._local_store[key][-MAX_CONTEXT_MESSAGES:]
        else:
            self._local_store[key].append(message)
            self._local_store[key] = self._local_store[key][-MAX_CONTEXT_MESSAGES:]

    async def get_context(
        self,
        tenant_id: str,
        contact_id: str,
        limit: int = MAX_CONTEXT_MESSAGES,
    ) -> list[dict]:
        """Retrieve conversation context for a contact."""
        key = self._key(tenant_id, contact_id)

        if self._use_redis:
            try:
                raw_messages = await self._redis.lrange(key, -limit, -1)
                return [json.loads(msg) for msg in raw_messages]
            except Exception as e:
                logger.error("redis_get_context_error", error=str(e))
                return self._local_store.get(key, [])[-limit:]
        else:
            return self._local_store.get(key, [])[-limit:]

    async def clear_context(self, tenant_id: str, contact_id: str) -> None:
        """Clear all messages for a conversation."""
        key = self._key(tenant_id, contact_id)
        if self._use_redis:
            try:
                await self._redis.delete(key)
            except Exception:
                pass
        self._local_store.pop(key, None)

    async def get_last_message_time(self, tenant_id: str, contact_id: str) -> Optional[datetime]:
        """Get timestamp of the last message in conversation."""
        key = self._key(tenant_id, contact_id)
        try:
            if self._use_redis:
                last_raw = await self._redis.lindex(key, -1)
                if last_raw:
                    return datetime.fromisoformat(json.loads(last_raw)["timestamp"])
            else:
                msgs = self._local_store.get(key, [])
                if msgs:
                    return datetime.fromisoformat(msgs[-1]["timestamp"])
        except Exception:
            pass
        return None

    async def set_human_handoff(self, tenant_id: str, contact_id: str, active: bool = True) -> None:
        """Flag a conversation for human handoff."""
        flag_key = f"tenant:{tenant_id}:contact:{contact_id}:human_handoff"
        if self._use_redis:
            try:
                if active:
                    await self._redis.set(flag_key, "1", ex=86400)
                else:
                    await self._redis.delete(flag_key)
            except Exception:
                self._local_store[flag_key] = ["1"] if active else []
        else:
            self._local_store[flag_key] = ["1"] if active else []

    async def is_human_handoff(self, tenant_id: str, contact_id: str) -> bool:
        """Check if conversation is flagged for human handoff."""
        flag_key = f"tenant:{tenant_id}:contact:{contact_id}:human_handoff"
        if self._use_redis:
            try:
                result = await self._redis.get(flag_key)
                return result == "1"
            except Exception:
                pass
        return bool(self._local_store.get(flag_key, []))


# Singleton instance
memory = ConversationMemory()

