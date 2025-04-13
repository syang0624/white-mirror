from fastapi import APIRouter, HTTPException, Request, status, Query
from uuid import UUID
from typing import List, Optional
from sqlalchemy import select

from app.core.context import get_postgres_client
from app.db.models import User, ManipulativeTechniques, Vulnerabilities
from app.dto.statistics import (
    AllStatisticRequest,
    SingleStatisticRequest,
    MessagesByTechniqueRequest,
    MessagesByVulnerabilityRequest,
    SingleStatisticResponse,
    AllStatisticResponse,
    StatisticResponseCore,
    AllStatisticResponseCore,
    TechniqueStatistics,
    VulnerabilityStatistics,
    MessagesByTechniqueResponse,
    MessagesByVulnerabilityResponse,
    MessagesByTechniqueResponseCore,
    MessagesByVulnerabilityResponseCore,
    ManipulativeMessage
)
from app.service.statistics import (
    get_all_statistics,
    get_single_statistics,
    get_messages_by_technique,
    get_messages_by_vulnerability
)
from loguru import logger

router = APIRouter()

@router.post("/all_statistics")
async def get_all_manipulation_statistics(request: Request, body: AllStatisticRequest):
    """
    Get manipulation statistics for all users who have communicated with the specified user
    """
    db_client = get_postgres_client(request)
    
    try:
        # Convert string to UUID for database query
        user_uuid = UUID(body.user_id)
        
        # Verify the user exists
        async with db_client.session_autocommit() as db:
            user_stmt = select(User).where(User.user_id == user_uuid)
            user_result = await db_client.select(user_stmt)
            user = user_result.first()
            
            if not user:
                return AllStatisticResponse(
                    code=status.HTTP_404_NOT_FOUND,
                    success=False,
                    message="User not found",
                    response=None
                )
        
        # Get statistics from service
        statistics = await get_all_statistics(
            db_client, 
            user_uuid, 
            body.max_users, 
            body.max_techniques, 
            body.max_vulnerabilities
        )
        
        # Convert to DTO format
        statistic_cores = []
        for stat in statistics:
            technique_stats = [
                TechniqueStatistics(
                    name=tech["name"],
                    count=tech["count"],
                    percentage=tech["percentage"]
                )
                for tech in stat["techniques"]
            ]
            
            vulnerability_stats = [
                VulnerabilityStatistics(
                    name=vuln["name"],
                    count=vuln["count"],
                    percentage=vuln["percentage"]
                )
                for vuln in stat["vulnerabilities"]
            ]
            
            statistic_cores.append(
                StatisticResponseCore(
                    person_id=stat["person_id"],
                    person_name=stat["person_name"],
                    total_messages=stat["total_messages"],
                    manipulative_count=stat["manipulative_count"],
                    manipulative_percentage=stat["manipulative_percentage"],
                    techniques=technique_stats,
                    vulnerabilities=vulnerability_stats
                )
            )
        
        # Create response
        return AllStatisticResponse(
            message="Statistics retrieved successfully",
            response=AllStatisticResponseCore(statistics=statistic_cores)
        )
        
    except ValueError:
        return AllStatisticResponse(
            code=status.HTTP_400_BAD_REQUEST,
            success=False,
            message="Invalid user ID format",
            response=None
        )
    except Exception as e:
        logger.error(f"Error getting all statistics: {str(e)}")
        return AllStatisticResponse(
            code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            success=False,
            message=f"Internal server error: {str(e)}",
            response=None
        )

@router.post("/single_statistics")
async def get_single_manipulation_statistics(request: Request, body: SingleStatisticRequest):
    """
    Get manipulation statistics for messages between two specific users
    """
    db_client = get_postgres_client(request)
    
    try:
        # Convert strings to UUIDs for database operations
        user_uuid = UUID(body.user_id)
        selected_user_uuid = UUID(body.selected_user_id)
        
        # Verify both users exist
        async with db_client.session_autocommit() as db:
            user_stmt = select(User).where(User.user_id == user_uuid)
            user_result = await db_client.select(user_stmt)
            user = user_result.first()
            
            selected_user_stmt = select(User).where(User.user_id == selected_user_uuid)
            selected_user_result = await db_client.select(selected_user_stmt)
            selected_user = selected_user_result.first()
            
            if not user or not selected_user:
                return SingleStatisticResponse(
                    code=status.HTTP_404_NOT_FOUND,
                    success=False,
                    message="One or both users not found",
                    response=None
                )
        
        # Get statistics from service
        statistics = await get_single_statistics(
            db_client, 
            user_uuid, 
            selected_user_uuid,
            body.max_techniques,
            body.max_vulnerabilities
        )
        
        if not statistics:
            return SingleStatisticResponse(
                code=status.HTTP_404_NOT_FOUND,
                success=False,
                message="No messages found between these users",
                response=None
            )
        
        # Convert to DTO format
        technique_stats = [
            TechniqueStatistics(
                name=tech["name"],
                count=tech["count"],
                percentage=tech["percentage"]
            )
            for tech in statistics["techniques"]
        ]
        
        vulnerability_stats = [
            VulnerabilityStatistics(
                name=vuln["name"],
                count=vuln["count"],
                percentage=vuln["percentage"]
            )
            for vuln in statistics["vulnerabilities"]
        ]
        
        statistic_core = StatisticResponseCore(
            person_id=statistics["person_id"],
            person_name=statistics["person_name"],
            total_messages=statistics["total_messages"],
            manipulative_count=statistics["manipulative_count"],
            manipulative_percentage=statistics["manipulative_percentage"],
            techniques=technique_stats,
            vulnerabilities=vulnerability_stats
        )
        
        # Create response
        return SingleStatisticResponse(
            message="Statistics retrieved successfully",
            response=statistic_core
        )
        
    except ValueError:
        return SingleStatisticResponse(
            code=status.HTTP_400_BAD_REQUEST,
            success=False,
            message="Invalid user ID format",
            response=None
        )
    except Exception as e:
        logger.error(f"Error getting single statistics: {str(e)}")
        return SingleStatisticResponse(
            code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            success=False,
            message=f"Internal server error: {str(e)}",
            response=None
        )

@router.post("/messages_by_technique")
async def get_messages_by_technique_endpoint(request: Request, body: MessagesByTechniqueRequest):
    """
    Get messages that have been flagged with a specific technique
    """
    db_client = get_postgres_client(request)
    
    try:
        # Convert strings to UUIDs for database operations
        user_uuid = UUID(body.user_id)
        selected_user_uuid = UUID(body.selected_user_id) if body.selected_user_id else None
        
        # Verify user exists
        async with db_client.session_autocommit() as db:
            user_stmt = select(User).where(User.user_id == user_uuid)
            user_result = await db_client.select(user_stmt)
            user = user_result.first()
            
            if not user:
                return MessagesByTechniqueResponse(
                    code=status.HTTP_404_NOT_FOUND,
                    success=False,
                    message="User not found",
                    response=None
                )
            
            # Verify selected user if provided
            if selected_user_uuid:
                selected_user_stmt = select(User).where(User.user_id == selected_user_uuid)
                selected_user_result = await db_client.select(selected_user_stmt)
                selected_user = selected_user_result.first()
                
                if not selected_user:
                    return MessagesByTechniqueResponse(
                        code=status.HTTP_404_NOT_FOUND,
                        success=False,
                        message="Selected user not found",
                        response=None
                    )
        
        # Get messages from service
        messages = await get_messages_by_technique(
            db_client,
            user_uuid,
            body.technique.value,
            selected_user_uuid,
            body.limit
        )
        
        # Convert to DTO format
        message_list = [
            ManipulativeMessage(
                message_id=msg["message_id"],
                content=msg["content"],
                timestamp=msg["timestamp"],
                techniques=msg["techniques"],
                vulnerabilities=msg["vulnerabilities"]
            )
            for msg in messages
        ]
        
        # Create response
        return MessagesByTechniqueResponse(
            message="Messages retrieved successfully",
            response=MessagesByTechniqueResponseCore(
                technique=body.technique.value,
                messages=message_list
            )
        )
        
    except ValueError:
        return MessagesByTechniqueResponse(
            code=status.HTTP_400_BAD_REQUEST,
            success=False,
            message="Invalid user ID format",
            response=None
        )
    except Exception as e:
        logger.error(f"Error getting messages by technique: {str(e)}")
        return MessagesByTechniqueResponse(
            code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            success=False,
            message=f"Internal server error: {str(e)}",
            response=None
        )

@router.post("/messages_by_vulnerability")
async def get_messages_by_vulnerability_endpoint(request: Request, body: MessagesByVulnerabilityRequest):
    """
    Get messages that have been flagged with a specific vulnerability
    """
    db_client = get_postgres_client(request)
    
    try:
        # Convert strings to UUIDs for database operations
        user_uuid = UUID(body.user_id)
        selected_user_uuid = UUID(body.selected_user_id) if body.selected_user_id else None
        
        # Verify user exists
        async with db_client.session_autocommit() as db:
            user_stmt = select(User).where(User.user_id == user_uuid)
            user_result = await db_client.select(user_stmt)
            user = user_result.first()
            
            if not user:
                return MessagesByVulnerabilityResponse(
                    code=status.HTTP_404_NOT_FOUND,
                    success=False,
                    message="User not found",
                    response=None
                )
            
            # Verify selected user if provided
            if selected_user_uuid:
                selected_user_stmt = select(User).where(User.user_id == selected_user_uuid)
                selected_user_result = await db_client.select(selected_user_stmt)
                selected_user = selected_user_result.first()
                
                if not selected_user:
                    return MessagesByVulnerabilityResponse(
                        code=status.HTTP_404_NOT_FOUND,
                        success=False,
                        message="Selected user not found",
                        response=None
                    )
        
        # Get messages from service
        messages = await get_messages_by_vulnerability(
            db_client,
            user_uuid,
            body.vulnerability.value,
            selected_user_uuid,
            body.limit
        )
        
        # Convert to DTO format
        message_list = [
            ManipulativeMessage(
                message_id=msg["message_id"],
                content=msg["content"],
                timestamp=msg["timestamp"],
                techniques=msg["techniques"],
                vulnerabilities=msg["vulnerabilities"]
            )
            for msg in messages
        ]
        
        # Create response
        return MessagesByVulnerabilityResponse(
            message="Messages retrieved successfully",
            response=MessagesByVulnerabilityResponseCore(
                vulnerability=body.vulnerability.value,
                messages=message_list
            )
        )
        
    except ValueError:
        return MessagesByVulnerabilityResponse(
            code=status.HTTP_400_BAD_REQUEST,
            success=False,
            message="Invalid user ID format",
            response=None
        )
    except Exception as e:
        logger.error(f"Error getting messages by vulnerability: {str(e)}")
        return MessagesByVulnerabilityResponse(
            code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            success=False,
            message=f"Internal server error: {str(e)}",
            response=None
        )