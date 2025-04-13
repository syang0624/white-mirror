from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID
from sqlalchemy import select, and_, or_, func, text
from loguru import logger

from app.db.models import Message, User, ManipulativeTechniques, Vulnerabilities
from app.db.postgres import Postgres

async def get_all_statistics(
    db_client: Postgres,
    user_id: UUID,  # This is the receiver
    max_users: int = 10,
    max_techniques: int = 5,
    max_vulnerabilities: int = 5
) -> List[Dict[str, Any]]:
    """
    Get manipulation statistics for all users who have communicated with the specified user
    """
    try:
        # First, find all users who have sent MANIPULATIVE messages to the specified user
        users_query = text("""
            SELECT DISTINCT sender_id 
            FROM messages 
            WHERE receiver_id = :user_id
            AND is_manipulative = TRUE
        """)
        
        # Execute the query with direct SQL
        async with db_client.session_autocommit() as db:
            result = await db.execute(users_query, {"user_id": user_id})
            sender_ids = [row[0] for row in result.fetchall()]
        
        logger.debug(f"Found {len(sender_ids)} users who sent manipulative messages")
        
        # For each sender, calculate manipulation statistics
        statistics = []
        for sender_id in sender_ids:
            user_stats = await get_single_statistics(
                db_client, 
                user_id,  # receiver
                sender_id,  # sender
                max_techniques,
                max_vulnerabilities
            )
            
            if user_stats:
                statistics.append(user_stats)
        
        # Sort by manipulative percentage (highest first) and limit to max_users
        statistics.sort(key=lambda x: x["manipulative_percentage"], reverse=True)
        return statistics[:max_users]
    
    except Exception as e:
        logger.error(f"Error getting all statistics: {str(e)}")
        return []

async def get_single_statistics(
    db_client: Postgres,
    user_id: UUID,  # This is the receiver
    selected_user_id: UUID,  # This is the sender
    max_techniques: int = 5,
    max_vulnerabilities: int = 5
) -> Optional[Dict[str, Any]]:
    """
    Get manipulation statistics for messages between two specific users
    """
    try:
        # Get the selected user's information
        async with db_client.session_autocommit() as db:
            user_stmt = select(User).where(User.user_id == selected_user_id)
            user_result = await db_client.select(user_stmt)
            selected_user = user_result.first()
            
            if not selected_user:
                logger.error(f"Selected user {selected_user_id} not found")
                return None
            
            # Extract User from Row if needed
            if hasattr(selected_user, 'User'):
                selected_user = selected_user.User
                
            # Query to get all messages FROM selected_user TO user
            messages_stmt = text("""
                SELECT * FROM messages 
                WHERE sender_id = :sender_id 
                AND receiver_id = :receiver_id
            """)
            
            result = await db.execute(
                messages_stmt, 
                {"sender_id": selected_user_id, "receiver_id": user_id}
            )
            messages = result.fetchall()
            
            if not messages:
                logger.info(f"No messages found from {selected_user_id} to {user_id}")
                return None
                
            # Calculate statistics
            total_messages = len(messages)
            
            # Now correctly filter manipulative messages
            manipulative_messages = [
                msg for msg in messages 
                if msg.is_manipulative
            ]
            
            manipulative_count = len(manipulative_messages)
            manipulative_percentage = (manipulative_count / total_messages) if total_messages > 0 else 0
            
            # Calculate techniques statistics
            techniques_count = {}
            for msg in manipulative_messages:
                if msg.techniques:
                    for technique in msg.techniques:
                        techniques_count[technique] = techniques_count.get(technique, 0) + 1
            
            technique_stats = [
                {
                    "name": technique,
                    "count": count,
                    "percentage": (count / manipulative_count) if manipulative_count > 0 else 0
                }
                for technique, count in techniques_count.items()
            ]
            
            # Sort by count and limit
            technique_stats.sort(key=lambda x: x["count"], reverse=True)
            technique_stats = technique_stats[:max_techniques]
            
            # Calculate vulnerabilities statistics
            vulnerabilities_count = {}
            for msg in manipulative_messages:
                if hasattr(msg, 'vulnerabilities') and msg.vulnerabilities:
                    for vulnerability in msg.vulnerabilities:
                        vulnerabilities_count[vulnerability] = vulnerabilities_count.get(vulnerability, 0) + 1
            
            vulnerability_stats = [
                {
                    "name": vulnerability,
                    "count": count,
                    "percentage": (count / manipulative_count) if manipulative_count > 0 else 0
                }
                for vulnerability, count in vulnerabilities_count.items()
            ]
            
            # Sort by count and limit
            vulnerability_stats.sort(key=lambda x: x["count"], reverse=True)
            vulnerability_stats = vulnerability_stats[:max_vulnerabilities]
            
            # Create the final statistics object
            return {
                "person_id": str(selected_user_id),
                "person_name": selected_user.user_name,
                "total_messages": total_messages,
                "manipulative_count": manipulative_count,
                "manipulative_percentage": manipulative_percentage,
                "techniques": technique_stats,
                "vulnerabilities": vulnerability_stats
            }
    
    except Exception as e:
        logger.error(f"Error getting single statistics: {str(e)}")
        return None

async def get_messages_by_technique(
    db_client: Postgres,
    user_id: UUID,
    technique: str,
    selected_user_id: Optional[UUID] = None,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Get messages that have been flagged with a specific technique
    
    Args:
        db_client: Postgres client
        user_id: UUID of the user requesting statistics (receiver)
        technique: The manipulation technique to filter by
        selected_user_id: Optional UUID of a specific sender to filter by
        limit: Maximum number of messages to return
        
    Returns:
        List of messages with the specified technique
    """
    try:
        async with db_client.session_autocommit() as db:
            # Build the query based on parameters
            if selected_user_id:
                # Get messages from a specific user with the technique
                query = text("""
                    SELECT m.message_id, m.content, m.timestamp, m.techniques, m.vulnerabilities
                    FROM messages m
                    WHERE m.receiver_id = :user_id
                      AND m.sender_id = :sender_id
                      AND m.is_manipulative = TRUE
                      AND :technique = ANY(m.techniques)
                    ORDER BY m.timestamp DESC
                    LIMIT :limit
                """)
                params = {
                    "user_id": user_id,
                    "sender_id": selected_user_id,
                    "technique": technique,
                    "limit": limit
                }
            else:
                # Get messages from any user with the technique
                query = text("""
                    SELECT m.message_id, m.content, m.timestamp, m.techniques, m.vulnerabilities
                    FROM messages m
                    WHERE m.receiver_id = :user_id
                      AND m.is_manipulative = TRUE
                      AND :technique = ANY(m.techniques)
                    ORDER BY m.timestamp DESC
                    LIMIT :limit
                """)
                params = {
                    "user_id": user_id,
                    "technique": technique,
                    "limit": limit
                }
            
            # Execute the query
            result = await db.execute(query, params)
            messages = result.fetchall()
            
            # Format the messages for response
            formatted_messages = []
            for msg in messages:
                formatted_messages.append({
                    "message_id": str(msg.message_id),
                    "content": msg.content,
                    "timestamp": msg.timestamp.isoformat(),
                    "techniques": list(msg.techniques) if msg.techniques else None,
                    "vulnerabilities": list(msg.vulnerabilities) if msg.vulnerabilities else None
                })
            
            return formatted_messages
    
    except Exception as e:
        logger.error(f"Error getting messages by technique: {str(e)}")
        return []

async def get_messages_by_vulnerability(
    db_client: Postgres,
    user_id: UUID,
    vulnerability: str,
    selected_user_id: Optional[UUID] = None,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Get messages that have been flagged with a specific vulnerability
    
    Args:
        db_client: Postgres client
        user_id: UUID of the user requesting statistics (receiver)
        vulnerability: The vulnerability to filter by
        selected_user_id: Optional UUID of a specific sender to filter by
        limit: Maximum number of messages to return
        
    Returns:
        List of messages with the specified vulnerability
    """
    try:
        async with db_client.session_autocommit() as db:
            # Build the query based on parameters
            if selected_user_id:
                # Get messages from a specific user with the vulnerability
                query = text("""
                    SELECT m.message_id, m.content, m.timestamp, m.techniques, m.vulnerabilities
                    FROM messages m
                    WHERE m.receiver_id = :user_id
                      AND m.sender_id = :sender_id
                      AND m.is_manipulative = TRUE
                      AND :vulnerability = ANY(m.vulnerabilities)
                    ORDER BY m.timestamp DESC
                    LIMIT :limit
                """)
                params = {
                    "user_id": user_id,
                    "sender_id": selected_user_id,
                    "vulnerability": vulnerability,
                    "limit": limit
                }
            else:
                # Get messages from any user with the vulnerability
                query = text("""
                    SELECT m.message_id, m.content, m.timestamp, m.techniques, m.vulnerabilities
                    FROM messages m
                    WHERE m.receiver_id = :user_id
                      AND m.is_manipulative = TRUE
                      AND :vulnerability = ANY(m.vulnerabilities)
                    ORDER BY m.timestamp DESC
                    LIMIT :limit
                """)
                params = {
                    "user_id": user_id,
                    "vulnerability": vulnerability,
                    "limit": limit
                }
            
            # Execute the query
            result = await db.execute(query, params)
            messages = result.fetchall()
            
            # Format the messages for response
            formatted_messages = []
            for msg in messages:
                formatted_messages.append({
                    "message_id": str(msg.message_id),
                    "content": msg.content,
                    "timestamp": msg.timestamp.isoformat(),
                    "techniques": list(msg.techniques) if msg.techniques else None,
                    "vulnerabilities": list(msg.vulnerabilities) if msg.vulnerabilities else None
                })
            
            return formatted_messages
    
    except Exception as e:
        logger.error(f"Error getting messages by vulnerability: {str(e)}")
        return []