from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import json
from datetime import datetime

from app.db.sessions import get_db # need to work on this
from app.db.models import User
from app.core.websocket import connection_manager
from app.service.chat_service import save_message, get_conversation, format_message_for_response

router = APIRouter(prefix="/chat", tags=["chat"])

# WebSocket endpoint
@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket, 
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for direct messaging
    Connect with: ws://your-domain/chat/ws?user_id={user_id}
    """
    # Verify the user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        await websocket.close(code=1008, reason="User not found")
        return
    
    # Connect to WebSocket
    await connection_manager.connect(websocket, user_id)
    
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
                
                # Save message using service
                new_message = await save_message(db, user_id, receiver_id, content)
                
                if not new_message:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Failed to save message"
                    })
                    continue
                
                # Format message for receiver
                message_for_receiver = await format_message_for_response(db, new_message, receiver_id)
                
                # Send to receiver if online
                sent = await connection_manager.send_message(message_for_receiver, receiver_id)
                
                # Send delivery receipt to sender
                await websocket.send_json({
                    "type": "receipt",
                    "message_id": new_message.id,
                    "delivered": sent,
                    "timestamp": datetime.utcnow().isoformat()
                })
                
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON format"
                })
                
    except WebSocketDisconnect:
        # Handle disconnection
        connection_manager.disconnect(user_id)

# REST endpoint to get messages
@router.get("/messages")
async def get_messages(
    user_id: int,
    other_user_id: int,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get messages between two users
    """
    # Verify both users exist
    user = db.query(User).filter(User.id == user_id).first()
    other_user = db.query(User).filter(User.id == other_user_id).first()
    
    if not user or not other_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get messages using service
    messages = await get_conversation(db, user_id, other_user_id, limit)
    return messages