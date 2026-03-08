"""Chat service — manages conversations and messages."""

import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.conversation import Conversation, Message
from app.agents.orchestrator import run_agent_pipeline


async def create_conversation(db: AsyncSession, user_id: uuid.UUID, title: Optional[str] = None) -> Conversation:
    """Create a new conversation."""
    conv = Conversation(user_id=user_id, title=title)
    db.add(conv)
    await db.flush()
    return conv


async def get_conversations(db: AsyncSession, user_id: uuid.UUID) -> list[Conversation]:
    """Get all conversations for a user."""
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())
    )
    return list(result.scalars().all())


async def get_conversation_with_messages(db: AsyncSession, conversation_id: uuid.UUID) -> Optional[Conversation]:
    """Get a conversation with all its messages."""
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conversation_id)
        .options(selectinload(Conversation.messages))
    )
    return result.scalar_one_or_none()


async def process_message(
    db: AsyncSession,
    user_id: uuid.UUID,
    conversation_id: uuid.UUID,
    user_message: str,
) -> dict:
    """Process a user message through the agent pipeline."""
    # Save user message
    user_msg = Message(
        conversation_id=conversation_id,
        role="user",
        content=user_message,
    )
    db.add(user_msg)
    await db.flush()

    # Run agent pipeline
    state = await run_agent_pipeline(
        user_message=user_message,
        user_id=str(user_id),
        conversation_id=str(conversation_id),
        db=db,
    )

    # Save assistant message
    assistant_msg = Message(
        conversation_id=conversation_id,
        role="assistant",
        content=state.formatted_response,
        metadata_={
            "intent": state.intent,
            "category": state.category,
            "confidence": state.confidence,
            "source": state.source,
            "execution_time_ms": state.execution_time_ms,
            "agents_trace": state.agents_trace,
            "validation_errors": state.validation_errors,
        },
    )
    db.add(assistant_msg)
    await db.flush()

    return {
        "message_id": str(assistant_msg.id),
        "content": state.formatted_response,
        "metadata": assistant_msg.metadata_,
    }
