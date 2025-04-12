from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Dict, Any, Optional
from loguru import logger

from app.db.models import Message, User


async def save_message(db: Session, sender_id: int, receiver_id: int, content: str) -> Optional[Message]:
    """
    Save a new message to the database
    
    Args:
        db: Database session
        sender_id: ID of the user sending the message
        receiver_id: ID of the user receiving the message
        content: Text content of the message
    
    Returns:
        The created Message object or None if there was an error
    """
    try:
        # Verify sender exists
        sender = db.query(User).filter(User.id == sender_id).first()
        if not sender:
            logger.error(f"Sender with ID {sender_id} not found")
            return None
            
        # Verify receiver exists
        receiver = db.query(User).filter(User.id == receiver_id).first()
        if not receiver:
            logger.error(f"Receiver with ID {receiver_id} not found")
            return None
            
        # Create and save the new message
        new_message = Message(
            sender_id=sender_id,
            receiver_id=receiver_id,
            content=content,
            timestamp=datetime.utcnow()
        )
        
        db.add(new_message)
        db.commit()
        db.refresh(new_message)
        
        logger.info(f"Message saved: ID {new_message.id} from {sender_id} to {receiver_id}")
        return new_message
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving message: {str(e)}")
        return None


async def get_conversation(db: Session, user_id: int, other_user_id: int, limit: int = 50) -> List[Dict[str, Any]]:
    """
    Get messages between two users
    
    Args:
        db: Database session
        user_id: ID of the first user
        other_user_id: ID of the second user
        limit: Maximum number of messages to return
    
    Returns:
        List of formatted message dictionaries
    """
    try:
        # Get messages exchanged between these users
        messages = db.query(Message).filter(
            ((Message.sender_id == user_id) & (Message.receiver_id == other_user_id)) |
            ((Message.sender_id == other_user_id) & (Message.receiver_id == user_id))
        ).order_by(Message.timestamp.desc()).limit(limit).all()
        
        # Format messages for response
        result = []
        for message in messages:
            sender = db.query(User).filter(User.id == message.sender_id).first()
            result.append({
                "id": message.id,
                "sender_id": message.sender_id,
                "sender_name": sender.full_name if sender else "Unknown",
                "content": message.content,
                "timestamp": message.timestamp.isoformat(),
                "is_sent_by_me": message.sender_id == user_id
            })
        
        # Return in chronological order
        result.reverse()
        
        logger.info(f"Retrieved {len(result)} messages between users {user_id} and {other_user_id}")
        return result
        
    except Exception as e:
        logger.error(f"Error retrieving conversation: {str(e)}")
        return []


async def format_message_for_response(db: Session, message: Message, user_id: int) -> Dict[str, Any]:
    """
    Format a message for the WebSocket response
    
    Args:
        db: Database session
        message: The Message object to format
        user_id: The user ID who will receive this formatted message
    
    Returns:
        Formatted message dictionary
    """
    try:
        sender = db.query(User).filter(User.id == message.sender_id).first()
        
        return {
            "type": "message",
            "id": message.id,
            "sender_id": message.sender_id,
            "sender_name": sender.full_name if sender else "Unknown",
            "content": message.content,
            "timestamp": message.timestamp.isoformat(),
            "is_sent_by_me": message.sender_id == user_id
        }
    except Exception as e:
        logger.error(f"Error formatting message: {str(e)}")
        return {
            "type": "message",
            "id": message.id,
            "sender_id": message.sender_id,
            "sender_name": "Unknown",
            "content": message.content,
            "timestamp": message.timestamp.isoformat(),
            "is_sent_by_me": message.sender_id == user_id
        }