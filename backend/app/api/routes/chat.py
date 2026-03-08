"""Chat routes — NOVA-EQP conversational interface."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.api.schemas import (
    ChatMessageRequest,
    ChatMessageResponse,
    ConversationResponse,
    ConversationDetailResponse,
    MessageResponse,
)
from app.services.chat_service import (
    create_conversation,
    get_conversations,
    get_conversation_with_messages,
    process_message,
)
from app.services.audit_service import log_action

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/message", response_model=ChatMessageResponse)
async def send_message(
    req: ChatMessageRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a message to NOVA-EQP and get a response."""
    # Get or create conversation
    if req.conversation_id:
        try:
            conversation_id = uuid.UUID(req.conversation_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de conversation invalide")

        conv = await get_conversation_with_messages(db, conversation_id)
        if not conv or conv.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Conversation non trouvée")
    else:
        conv = await create_conversation(db, current_user.id, title=req.message[:50])
        conversation_id = conv.id

    # Process through agent pipeline
    result = await process_message(db, current_user.id, conversation_id, req.message)

    # Audit log
    await log_action(
        db,
        user_id=current_user.id,
        action="chat_message",
        resource_type="conversation",
        resource_id=conversation_id,
        details={"intent": result.get("metadata", {}).get("intent")},
        ip_address=request.client.host if request.client else None,
    )

    return ChatMessageResponse(
        message_id=result["message_id"],
        content=result["content"],
        conversation_id=str(conversation_id),
        metadata=result.get("metadata"),
    )


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all conversations for the current user."""
    convs = await get_conversations(db, current_user.id)
    return [
        ConversationResponse(
            id=str(c.id),
            title=c.title,
            created_at=c.created_at,
            updated_at=c.updated_at,
        )
        for c in convs
    ]


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a conversation with all messages."""
    try:
        conv_uuid = uuid.UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID invalide")

    conv = await get_conversation_with_messages(db, conv_uuid)
    if not conv or conv.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")

    return ConversationDetailResponse(
        id=str(conv.id),
        title=conv.title,
        messages=[
            MessageResponse(
                id=str(m.id),
                role=m.role,
                content=m.content,
                metadata=m.metadata_,
                created_at=m.created_at,
            )
            for m in sorted(conv.messages, key=lambda x: x.created_at)
        ],
        created_at=conv.created_at,
    )
