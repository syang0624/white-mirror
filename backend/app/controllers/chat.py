from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Request, Query, status
import json
from datetime import datetime, timezone
from typing import List, Dict, Any
from uuid import UUID
from sqlalchemy import select

from app.db.models import User
from app.core.context import get_postgres_client, get_ws_manager
from app.service.chat_service import save_message, get_conversation, format_message_for_response
from app.dto.chat import (
    MessagesResponse, 
    MessagesResponseCore, 
    MessageCore,
    WebSocketErrorResponse,
    WebSocketReceiptResponse
)
from loguru import logger
from app.core.context import get_global_context

router = APIRouter()

# WebSocket endpoint
@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket, 
    user_id: str = Query(..., description="User ID")
):
    """
    WebSocket endpoint for direct messaging
    Connect with: ws://your-domain/chat/ws?user_id={user_id}
    """
    # Get context from global variable
    context = get_global_context()
    
    if not context:
        print("No global context available")
        await websocket.close(code=1011, reason="Application context not available")
        return
    
    # Get services from context
    db_client = context.db_workspace
    ws_manager = context.ws_manager
    
    # Verify the user exists
    try:
        # Convert to UUID for database query
        user_uuid = UUID(user_id)
        
        async with db_client.session_autocommit() as db:
            stmt = select(User).where(User.user_id == user_uuid)
            result = await db_client.select(stmt)
            user = result.first()
            
            if not user:
                await websocket.close(code=1008, reason="User not found")
                return
                
            # Try to access user data differently if needed
            if hasattr(user, 'User'):
                user = user.User
    except ValueError:
        await websocket.close(code=1008, reason="Invalid user ID format")
        return
    except Exception as e:
        print(f"Error verifying user: {str(e)}")
        await websocket.close(code=1011, reason="Database query error")
        return
    
    # Connect to WebSocket - pass the string ID
    await ws_manager.connect(websocket, user_id)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            
            try:
                # Parse message data
                message_data = json.loads(data)
                
                # Validate required fields
                if "receiver_id" not in message_data or "content" not in message_data:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Missing required fields (receiver_id, content)"
                    })
                    continue
                
                receiver_id = message_data["receiver_id"]
                content = message_data["content"]
                
                # Convert to UUID if string was provided
                if not isinstance(receiver_id, str):
                    await websocket.send_json({
                        "type": "error",
                        "message": "receiver_id must be a string"
                    })
                    continue
                
                try:
                    # Validate UUID format but keep as string for service layer
                    UUID(receiver_id)
                except ValueError:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Invalid receiver_id format, must be a valid UUID"
                    })
                    continue
                
                # Save message using service - pass string IDs
                new_message = await save_message(db_client, user_id, receiver_id, content)
                
                if not new_message:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Failed to save message"
                    })
                    continue
                
                # Format message for receiver - pass string receiver_id
                message_for_receiver = await format_message_for_response(db_client, new_message, receiver_id)
                
                # Send to receiver if online - pass string ID
                sent = await ws_manager.send_message(message_for_receiver, receiver_id)
                
                # Send delivery receipt to sender
                await websocket.send_json({
                    "type": "receipt",
                    "message_id": str(new_message.message_id),  # Ensure this is a string
                    "delivered": sent,
                    "timestamp": datetime.now(tz=timezone.utc).isoformat()
                })
                
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON format"
                })
                
    except WebSocketDisconnect:
        # Handle disconnection - pass string ID
        ws_manager.disconnect(user_id)
    finally:
        # Clean up resources
        logger.info(f"WebSocket connection closed for user {user_id}")

# REST endpoint to get messages
@router.get("/messages")
async def get_messages(
    user_id: str, 
    other_user_id: str, 
    request: Request,
    limit: int = 50,
):
    """Get messages between two users"""
    db_client = get_postgres_client(request)
    
    try:
        # Convert strings to UUIDs for database operations
        user_uuid = UUID(user_id)
        other_user_uuid = UUID(other_user_id)
        
        async with db_client.session_autocommit() as db:
            # Verify both users exist
            user_stmt = select(User).where(User.user_id == user_uuid)
            user_result = await db_client.select(user_stmt)
            user = user_result.first()
            
            other_user_stmt = select(User).where(User.user_id == other_user_uuid)
            other_user_result = await db_client.select(other_user_stmt)
            other_user = other_user_result.first()
            
            if not user or not other_user:
                return MessagesResponse(
                    code=status.HTTP_404_NOT_FOUND,
                    success=False,
                    message="One or both users not found",
                    response=None
                )
        
        # Get messages using service - pass UUID objects since the service expects them
        raw_messages = await get_conversation(db_client, user_uuid, other_user_uuid, limit)
        
        # Convert to DTO format
        message_cores = [
            MessageCore(
                id=msg["id"],
                sender_id=msg["sender_id"],
                sender_name=msg["sender_name"],
                content=msg["content"],
                timestamp=msg["timestamp"],
                is_sent_by_me=msg["is_sent_by_me"],
                is_manipulative=msg.get("is_manipulative", False),
                techniques=msg.get("techniques"),
                vulnerabilities=msg.get("vulnerabilities")
            )
            for msg in raw_messages
        ]
        
        return MessagesResponse(
            message="Messages retrieved successfully",
            response=MessagesResponseCore(messages=message_cores)
        )
    except ValueError:
        return MessagesResponse(
            code=status.HTTP_400_BAD_REQUEST,
            success=False,
            message="Invalid user ID format",
            response=None
        )