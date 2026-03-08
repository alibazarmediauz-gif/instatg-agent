"""
Unified Message Storage Service
Handles storage of conversations and individual messages across all channels.
"""

import structlog
from uuid import UUID
from datetime import datetime
from typing import Optional
from sqlalchemy import select, and_, update
from app.database import async_session_factory
from app.models import Conversation, Message, MessageRole, MessageType, ChannelType

logger = structlog.get_logger(__name__)

class MessageStorageService:
    @staticmethod
    async def get_or_create_conversation(
        tenant_id: str,
        channel: str,
        contact_id: str,
        contact_name: Optional[str] = None,
        contact_username: Optional[str] = None
    ) -> UUID:
        """
        Retrieves an existing conversation or creates a new one.
        """
        async with async_session_factory() as db:
            try:
                # Convert string channel to Enum
                channel_enum = ChannelType(channel.lower())
                
                # Look for existing active conversation
                stmt = select(Conversation).where(
                    and_(
                        Conversation.tenant_id == tenant_id,
                        Conversation.channel == channel_enum,
                        Conversation.contact_id == str(contact_id)
                    )
                )
                result = await db.execute(stmt)
                convo = result.scalar_one_or_none()

                if convo:
                    # Update metadata if provided
                    if contact_name or contact_username:
                        convo.contact_name = contact_name or convo.contact_name
                        convo.contact_username = contact_username or convo.contact_username
                        convo.last_message_at = datetime.utcnow()
                        await db.commit()
                    return convo.id

                # Create new conversation
                new_convo = Conversation(
                    tenant_id=tenant_id,
                    channel=channel_enum,
                    contact_id=str(contact_id),
                    contact_name=contact_name or "New Customer",
                    contact_username=contact_username,
                    last_message_at=datetime.utcnow()
                )
                db.add(new_convo)
                await db.commit()
                await db.refresh(new_convo)
                
                logger.info("conversation_created", tenant=tenant_id, channel=channel, contact=contact_id)
                return new_convo.id
            except Exception as e:
                logger.error("get_or_create_conversation_failed", error=str(e), tenant=tenant_id)
                raise

    @staticmethod
    async def store_message(
        conversation_id: UUID,
        role: str,
        content: str,
        message_type: str = "text",
        media_url: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> UUID:
        """
        Persists a message to the database and updates conversation timestamp.
        """
        async with async_session_factory() as db:
            try:
                # Map role string to Enum
                role_enum = MessageRole(role.lower())
                type_enum = MessageType(message_type.lower())

                new_msg = Message(
                    conversation_id=conversation_id,
                    role=role_enum,
                    message_type=type_enum,
                    content=content,
                    media_url=media_url,
                    metadata_=metadata
                )
                db.add(new_msg)
                
                # Update conversation last_message_at
                await db.execute(
                    update(Conversation)
                    .where(Conversation.id == conversation_id)
                    .values(last_message_at=datetime.utcnow())
                )
                
                await db.commit()
                await db.refresh(new_msg)
                
                logger.debug("message_stored", convo_id=str(conversation_id), role=role)
                return new_msg.id
            except Exception as e:
                logger.error("store_message_failed", error=str(e), convo_id=str(conversation_id))
                raise

storage = MessageStorageService()
