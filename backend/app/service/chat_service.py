from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from uuid import UUID, uuid4
from loguru import logger
from sqlalchemy import select, or_, and_

from app.db.models import Message, User
from app.db.postgres import Postgres
from app.core.context import get_global_context


async def save_message(
    db_client: Postgres, 
    sender_id: str, 
    receiver_id: str, 
    content: str
) -> Optional[Message]:
    """
    Save a new message to the database
    """
    try:
        # Convert string IDs to UUID objects for database operations
        sender_uuid = UUID(sender_id)
        receiver_uuid = UUID(receiver_id)
        
        # Verify sender exists
        sender_stmt = select(User).where(User.user_id == sender_uuid)
        sender_result = await db_client.select(sender_stmt)
        sender = sender_result.first()
        
        if not sender:
            logger.error(f"Sender with ID {sender_id} not found")
            return None
            
        # Verify receiver exists
        receiver_stmt = select(User).where(User.user_id == receiver_uuid)
        receiver_result = await db_client.select(receiver_stmt)
        receiver = receiver_result.first()
        
        if not receiver:
            logger.error(f"Receiver with ID {receiver_id} not found")
            return None
        
        # Extract the User entity if needed
        if hasattr(sender, 'User'):
            sender = sender.User
        if hasattr(receiver, 'User'):
            receiver = receiver.User

        classifier = get_global_context().classifier
        classification = classifier.predict(content)
    
        # Create message object
        message_id = uuid4()
        new_message = Message(
            message_id=message_id,
            sender_id=sender_uuid,
            receiver_id=receiver_uuid,
            content=content,
            timestamp=datetime.now(tz=timezone.utc),
            is_manipulative=classification["is_manipulative"],
            techniques=classification["techniques"] if classification["is_manipulative"] else None,
            vulnerabilities=classification["vulnerabilities"] if classification["is_manipulative"] else None
        )
        
        # Save to database
        await db_client.insert([new_message])
        
        # Instead of returning the SQLAlchemy object, create a new one with all the data we need
        # This ensures we don't try to access attributes after the session is closed
        result_message = Message(
            message_id=message_id,
            sender_id=sender_uuid,
            receiver_id=receiver_uuid,
            content=content,
            timestamp=datetime.now(tz=timezone.utc),
            is_manipulative=classification["is_manipulative"],
            techniques=classification["techniques"] if classification["is_manipulative"] else None,
            vulnerabilities=classification["vulnerabilities"] if classification["is_manipulative"] else None
        )
        
        logger.info(f"Message saved: ID {message_id} from {sender_id} to {receiver_id}")
        return result_message
        
    except Exception as e:
        logger.error(f"Error saving message: {str(e)}")
        return None


async def get_conversation(
    db_client: Postgres, 
    user_id: UUID, 
    other_user_id: UUID, 
    limit: int = 50
) -> List[Dict[str, Any]]:
    """
    Get messages between two users
    
    Args:
        db_client: Postgres client
        user_id: UUID of the first user
        other_user_id: UUID of the second user
        limit: Maximum number of messages to return
    
    Returns:
        List of formatted message dictionaries
    """
    try:
        # Get messages exchanged between these users
        stmt = select(Message).where(
            or_(
                and_(Message.sender_id == user_id, Message.receiver_id == other_user_id),
                and_(Message.sender_id == other_user_id, Message.receiver_id == user_id)
            )
        ).order_by(Message.timestamp.desc()).limit(limit)
        
        result = await db_client.select(stmt)
        messages = result.all()
        
        # Format messages for response
        formatted_messages = []
        for message_row in messages:
            # Handle different SQLAlchemy result formats
            message = message_row.Message if hasattr(message_row, 'Message') else message_row
            
            try:
                # Get sender info
                sender_stmt = select(User).where(User.user_id == message.sender_id)
                sender_result = await db_client.select(sender_stmt)
                sender_row = sender_result.first()
                
                # Access user data properly
                sender = sender_row.User if hasattr(sender_row, 'User') else sender_row
                
                formatted_messages.append({
                    "id": str(message.message_id),  # Convert UUID to string
                    "sender_id": str(message.sender_id),  # Convert UUID to string
                    "sender_name": sender.user_name if sender else "Unknown",
                    "content": message.content,
                    "timestamp": message.timestamp.isoformat(),
                    "is_sent_by_me": str(message.sender_id) == str(user_id),  # Compare strings
                    "is_manipulative": bool(message.is_manipulative) if hasattr(message, "is_manipulative") else False,
                    "techniques": list(message.techniques) if hasattr(message, "techniques") and message.techniques else None,
                    "vulnerabilities": list(message.vulnerabilities) if hasattr(message, "vulnerabilities") and message.vulnerabilities else None
                })
            except AttributeError as e:
                # Handle case where there's an issue accessing attributes
                logger.error(f"AttributeError processing message: {str(e)}")
                # Try to create a minimal valid message entry
                formatted_messages.append({
                    "id": str(message.message_id) if hasattr(message, "message_id") else "unknown",
                    "sender_id": str(message.sender_id) if hasattr(message, "sender_id") else "unknown",
                    "sender_name": "Unknown",
                    "content": message.content if hasattr(message, "content") else "",
                    "timestamp": message.timestamp.isoformat() if hasattr(message, "timestamp") else datetime.now(tz=timezone.utc).isoformat(),
                    "is_sent_by_me": False,
                    "is_manipulative": False,
                    "techniques": None,
                    "vulnerabilities": None
                })
        
        # Return in chronological order
        formatted_messages.reverse()
        
        logger.info(f"Retrieved {len(formatted_messages)} messages between users {user_id} and {other_user_id}")
        return formatted_messages
        
    except Exception as e:
        logger.error(f"Error retrieving conversation: {str(e)}")
        return []


async def format_message_for_response(
    db_client: Postgres, 
    message: Message, 
    user_id: str
) -> Dict[str, Any]:
    """
    Format a message for the WebSocket response
    
    Args:
        db_client: Postgres client
        message: The Message object to format
        user_id: The user ID (string) who will receive this formatted message
    
    Returns:
        Formatted message dictionary
    """
    try:
        # Convert string to UUID for database query
        user_uuid = UUID(user_id)
        
        # Get sender info
        sender_stmt = select(User).where(User.user_id == message.sender_id)
        sender_result = await db_client.select(sender_stmt)
        sender = sender_result.first()
        
        # Extract User from Row if needed
        if hasattr(sender, 'User'):
            sender = sender.User
            
        # Convert all UUIDs to strings for JSON serialization
        return {
            "type": "message",
            "id": str(message.message_id),  # Convert UUID to string
            "sender_id": str(message.sender_id),  # Convert UUID to string
            "sender_name": sender.user_name if sender else "Unknown",
            "content": message.content,
            "timestamp": message.timestamp.isoformat(),
            "is_sent_by_me": str(message.sender_id) == str(user_uuid),  # Compare strings
            "is_manipulative": bool(message.is_manipulative) if hasattr(message, "is_manipulative") else False,
            "techniques": list(message.techniques) if hasattr(message, "techniques") and message.techniques else None,
            "vulnerabilities": list(message.vulnerabilities) if hasattr(message, "vulnerabilities") and message.vulnerabilities else None
        }
    except Exception as e:
        logger.error(f"Error formatting message: {str(e)}")
        # Fallback that ensures all UUIDs are converted to strings
        return {
            "type": "message",
            "id": str(message.message_id),
            "sender_id": str(message.sender_id),
            "sender_name": "Unknown",
            "content": message.content,
            "timestamp": message.timestamp.isoformat(),
            "is_sent_by_me": False
        }