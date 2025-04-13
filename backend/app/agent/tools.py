from typing import Optional, Dict, Any, List
from langchain_core.tools import tool
from uuid import UUID
from pydantic import BaseModel, Field

from app.core.context import get_global_perplexity, get_global_postgres_client
from app.service.statistics import (
    get_all_statistics, 
    get_single_statistics,
    get_messages_by_technique, 
    get_messages_by_vulnerability
)
from app.db.models import ManipulativeTechniques, Vulnerabilities

# Schema definitions for tool responses
class TechniqueStatistics(BaseModel):
    name: str = Field(description="Name of the manipulation technique")
    count: int = Field(description="Number of times this technique was used")
    percentage: float = Field(description="Percentage of manipulative messages using this technique")

class VulnerabilityStatistics(BaseModel):
    name: str = Field(description="Name of the targeted vulnerability")
    count: int = Field(description="Number of times this vulnerability was targeted")
    percentage: float = Field(description="Percentage of manipulative messages targeting this vulnerability")

class UserStatistics(BaseModel):
    person_id: str = Field(description="Unique identifier of the user")
    person_name: str = Field(description="Name of the user")
    total_messages: int = Field(description="Total number of messages sent by this user")
    manipulative_count: int = Field(description="Number of manipulative messages sent by this user")
    manipulative_percentage: float = Field(description="Percentage of messages that are manipulative")
    techniques: List[TechniqueStatistics] = Field(description="List of manipulation techniques used, sorted by frequency")
    vulnerabilities: List[VulnerabilityStatistics] = Field(description="List of vulnerabilities targeted, sorted by frequency")

class Message(BaseModel):
    message_id: str = Field(description="Unique identifier of the message")
    content: str = Field(description="Content of the message")
    timestamp: str = Field(description="Timestamp when the message was sent")
    techniques: Optional[List[str]] = Field(None, description="Manipulation techniques detected in this message")
    vulnerabilities: Optional[List[str]] = Field(None, description="Vulnerabilities targeted by this message")

# Tools implementation
@tool(description="Get manipulation statistics for all users who have messaged the current user. Returns users sorted from most to least manipulative, with detailed statistics about manipulation techniques and targeted vulnerabilities.")
async def analyze_all_users(
    max_users: int = Field(10, description="Maximum number of users to return"),
    max_techniques: int = Field(5, description="Maximum number of techniques to include per user"),
    max_vulnerabilities: int = Field(5, description="Maximum number of vulnerabilities to include per user")
) -> Dict[str, Any]:
    """
    Analyze manipulative behavior across all users who have sent messages to the current user.
    
    Args:
        max_users: Maximum number of users to return in the results
        max_techniques: Maximum number of techniques to include in each user's statistics
        max_vulnerabilities: Maximum number of vulnerabilities to include in each user's statistics
        
    Returns:
        Dictionary with statistics for each user sorted by manipulative percentage (highest first)
    """
    # Get user_id from the current request context
    # In production, this would come from the API request or user session
    db_client = get_global_postgres_client()
    
    if not db_client:
        return {"error": "Database connection not available"}
    
    # The user_id will be injected when tool is created in the controller
    user_id = None  # This will be replaced with actual user_id
    
    try:
        statistics = await get_all_statistics(
            db_client, 
            user_id, 
            max_users, 
            max_techniques, 
            max_vulnerabilities
        )
        
        return {
            "user_count": len(statistics),
            "users": statistics
        }
    except Exception as e:
        return {"error": f"Failed to retrieve statistics: {str(e)}"}

@tool(description="Get detailed manipulation statistics for a specific user, including techniques used and vulnerabilities targeted.")
async def analyze_specific_user(
    selected_user_id: str = Field(..., description="ID of the user to analyze"),
    max_techniques: int = Field(5, description="Maximum number of techniques to include"),
    max_vulnerabilities: int = Field(5, description="Maximum number of vulnerabilities to include")
) -> Dict[str, Any]:
    """
    Analyze manipulative behavior for a specific user who has sent messages to the current user.
    
    Args:
        selected_user_id: ID of the user to analyze
        max_techniques: Maximum number of techniques to include in the statistics
        max_vulnerabilities: Maximum number of vulnerabilities to include in the statistics
        
    Returns:
        Dictionary with detailed statistics about the user's manipulative behavior
    """
    db_client = get_global_postgres_client()
    
    if not db_client:
        return {"error": "Database connection not available"}
    
    # The user_id will be injected when tool is created in the controller
    user_id = None  # This will be replaced with actual user_id
    
    try:
        selected_user_uuid = UUID(selected_user_id)
        statistics = await get_single_statistics(
            db_client, 
            user_id, 
            selected_user_uuid,
            max_techniques,
            max_vulnerabilities
        )
        
        if not statistics:
            return {"error": "No messages found for this user"}
        
        return statistics
    except ValueError:
        return {"error": "Invalid user ID format"}
    except Exception as e:
        return {"error": f"Failed to retrieve statistics: {str(e)}"}

@tool(description="Find messages using a specific manipulation technique, sorted by recency.")
async def find_messages_with_technique(
    technique: str = Field(..., description="Manipulation technique to search for (e.g., 'Persuasion or Seduction', 'Rationalization')"),
    selected_user_id: Optional[str] = Field(None, description="Optional: ID of a specific user to analyze. If not provided, will search across all users."),
    limit: int = Field(10, description="Maximum number of messages to return")
) -> Dict[str, Any]:
    """
    Find messages that use a specific manipulation technique, sorted by recency.
    
    Args:
        technique: The manipulation technique to search for
        selected_user_id: Optional ID of a specific user to filter by
        limit: Maximum number of messages to return
        
    Returns:
        Dictionary with the technique name and list of matching messages
    """
    db_client = get_global_postgres_client()
    
    if not db_client:
        return {"error": "Database connection not available"}
    
    # The user_id will be injected when tool is created in the controller
    user_id = None  # This will be replaced with actual user_id
    
    try:
        # Validate technique is one of the valid enum values
        valid_techniques = [tech.value for tech in ManipulativeTechniques]
        if technique not in valid_techniques:
            return {
                "error": f"Invalid technique. Valid options are: {', '.join(valid_techniques)}"
            }
        
        selected_user_uuid = UUID(selected_user_id) if selected_user_id else None
        
        messages = await get_messages_by_technique(
            db_client,
            user_id,
            technique,
            selected_user_uuid,
            limit
        )
        
        return {
            "technique": technique,
            "message_count": len(messages),
            "messages": messages
        }
    except ValueError:
        return {"error": "Invalid user ID format"}
    except Exception as e:
        return {"error": f"Failed to retrieve messages: {str(e)}"}

@tool(description="Find messages targeting a specific vulnerability, sorted by recency.")
async def find_messages_targeting_vulnerability(
    vulnerability: str = Field(..., description="Vulnerability to search for (e.g., 'Dependency', 'Naivete')"),
    selected_user_id: Optional[str] = Field(None, description="Optional: ID of a specific user to analyze. If not provided, will search across all users."),
    limit: int = Field(10, description="Maximum number of messages to return")
) -> Dict[str, Any]:
    """
    Find messages that target a specific vulnerability, sorted by recency.
    
    Args:
        vulnerability: The vulnerability to search for
        selected_user_id: Optional ID of a specific user to filter by
        limit: Maximum number of messages to return
        
    Returns:
        Dictionary with the vulnerability name and list of matching messages
    """
    db_client = get_global_postgres_client()
    
    if not db_client:
        return {"error": "Database connection not available"}
    
    # The user_id will be injected when tool is created in the controller
    user_id = None  # This will be replaced with actual user_id
    
    try:
        # Validate vulnerability is one of the valid enum values
        valid_vulnerabilities = [vuln.value for vuln in Vulnerabilities]
        if vulnerability not in valid_vulnerabilities:
            return {
                "error": f"Invalid vulnerability. Valid options are: {', '.join(valid_vulnerabilities)}"
            }
        
        selected_user_uuid = UUID(selected_user_id) if selected_user_id else None
        
        messages = await get_messages_by_vulnerability(
            db_client,
            user_id,
            vulnerability,
            selected_user_uuid,
            limit
        )
        
        return {
            "vulnerability": vulnerability,
            "message_count": len(messages),
            "messages": messages
        }
    except ValueError:
        return {"error": "Invalid user ID format"}
    except Exception as e:
        return {"error": f"Failed to retrieve messages: {str(e)}"}

# Function to create tools with injected user_id
def create_tools_with_user_id(user_id: UUID):
    """Create tool instances with user_id injected into their closures"""
    
    # Create tool instances with user_id injected
    @tool(description=analyze_all_users.description)
    async def analyze_all_users_with_user(
        max_users: int = 10,
        max_techniques: int = 5,
        max_vulnerabilities: int = 5
    ):
        db_client = get_global_postgres_client()
        statistics = await get_all_statistics(db_client, user_id, max_users, max_techniques, max_vulnerabilities)
        return {
            "user_count": len(statistics),
            "users": statistics
        }
    
    @tool(description=analyze_specific_user.description)
    async def analyze_specific_user_with_user(
        selected_user_id: str,
        max_techniques: int = 5,
        max_vulnerabilities: int = 5
    ):
        db_client = get_global_postgres_client()
        try:
            selected_user_uuid = UUID(selected_user_id)
            statistics = await get_single_statistics(db_client, user_id, selected_user_uuid, max_techniques, max_vulnerabilities)
            return statistics if statistics else {"error": "No messages found for this user"}
        except Exception as e:
            return {"error": str(e)}
    
    @tool(description=find_messages_with_technique.description)
    async def find_messages_with_technique_with_user(
        technique: str,
        selected_user_id: Optional[str] = None,
        limit: int = 10
    ):
        db_client = get_global_postgres_client()
        try:
            selected_user_uuid = UUID(selected_user_id) if selected_user_id else None
            messages = await get_messages_by_technique(db_client, user_id, technique, selected_user_uuid, limit)
            return {
                "technique": technique,
                "message_count": len(messages),
                "messages": messages
            }
        except Exception as e:
            return {"error": str(e)}
    
    @tool(description=find_messages_targeting_vulnerability.description)
    async def find_messages_targeting_vulnerability_with_user(
        vulnerability: str,
        selected_user_id: Optional[str] = None,
        limit: int = 10
    ):
        db_client = get_global_postgres_client()
        try:
            selected_user_uuid = UUID(selected_user_id) if selected_user_id else None
            messages = await get_messages_by_vulnerability(db_client, user_id, vulnerability, selected_user_uuid, limit)
            return {
                "vulnerability": vulnerability,
                "message_count": len(messages),
                "messages": messages
            }
        except Exception as e:
            return {"error": str(e)}

    return [
        analyze_all_users_with_user,
        analyze_specific_user_with_user,
        find_messages_with_technique_with_user,
        find_messages_targeting_vulnerability_with_user,
        web_search
    ]

@tool(description="Search the web for general information about manipulation, psychology, or communication patterns. Use this ONLY for general knowledge questions, not for personal user data.")
async def web_search(
    query: str = Field(..., description="Search query about manipulation, psychology, or communication patterns. This should be used for general questions only, not for analyzing a user's personal conversations.")
) -> str:
    """
    Search the web for general information about manipulation, psychology, or communication patterns.
    Only use this for general knowledge questions that require external information (e.g., "What are common manipulation techniques?")
    DO NOT use this for analyzing a specific user's conversations - use the analyze_* tools for that.
    
    Args:
        query: Search query about manipulation, psychology, or communication patterns
        
    Returns:
        Search results from the web
    """
    perplexity = get_global_perplexity()
    
    if not perplexity:
        return "Web search is currently unavailable."
    
    try:
        # Format the query to focus on manipulation and psychology topics
        enhanced_query = f"Provide a concise, factual response about the following topic related to manipulation or psychology: {query}"
        
        # Create a system message that guides the response format
        messages = [
            {"role": "system", "content": "You are a helpful assistant providing factual information about psychology, manipulation tactics, and healthy communication patterns. Keep your responses informative, educational, and concise."},
            {"role": "user", "content": enhanced_query}
        ]
        
        # Invoke Perplexity
        response = await perplexity.ainvoke(messages)
        
        # Return the content
        return response.content
    except Exception as e:
        return f"Error searching the web: {str(e)}"


# Create tool list for the agent
tools = [
    web_search,
    analyze_all_users,
    analyze_specific_user,
    find_messages_with_technique,
    find_messages_targeting_vulnerability
]