from typing import List, Dict, Any, Optional, Union, Literal
from pydantic import BaseModel, Field
from uuid import UUID
from app.agent.models import LLMMessage

class ChatToolCall(BaseModel):
    """Tool call in a chat response."""
    id: str
    name: str
    args: str
    result: Optional[Any] = None

class ChatResponseData(BaseModel):
    """Data in a chat response."""
    text: str
    tool_calls: List[ChatToolCall] = []

class ChatResponse(BaseModel):
    """Response from the chat endpoint."""
    success: bool = True
    message: str = "Success"
    response: Optional[ChatResponseData] = None

class ChatMessage(BaseModel):
    """A chat message."""
    role: Literal["user", "assistant", "system", "tool"]
    content: str
    name: Optional[str] = None
    tool_call_id: Optional[str] = None

class ChatRequest(BaseModel):
    """Request for the chat endpoint."""
    messages: List[LLMMessage]
    stream: bool = False
    system: Optional[str] = None
    user_id: str = Field(..., description="ID of the current user")

class ChatStreamChunk(BaseModel):
    """Chunk of a streaming chat response."""
    text: Optional[str] = None
    tool_calls: Optional[List[Dict[str, Any]]] = None
    done: bool = False
    error: Optional[str] = None

class ChatStreamResponse(BaseModel):
    """Full streaming chat response (for documentation only)."""
    chunks: List[ChatStreamChunk]



class SimpleChatRequest(BaseModel):
    """Simple request for the chat endpoint."""
    user_id: str = Field(..., description="ID of the current user")
    message: str = Field(..., description="Message from the user")

class SimpleChatToolCall(BaseModel):
    """Tool call in a simple chat response."""
    id: str
    name: str
    args: str
    result: Optional[Any] = None

class SimpleChatResponse(BaseModel):
    """Response from the simple chat endpoint."""
    success: bool = True
    message: str = "Success"
    text: str = ""
    tool_calls: List[SimpleChatToolCall] = []