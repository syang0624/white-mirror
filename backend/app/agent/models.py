from typing import List, Union, Optional, Any, Literal
from pydantic import BaseModel

class LLMTextPart(BaseModel):
    type: Literal["text"]
    text: str
    providerMetadata: Optional[Any] = None

"""
class LLMImagePart(BaseModel):
    type: Literal["image"]
    image: str
    mimeType: Optional[str] = None
    providerMetadata: Optional[Any] = None

class LLMFilePart(BaseModel):
    type: Literal["file"]
    data: str
    mimeType: str
    providerMetadata: Optional[Any] = None
"""

class LLMToolCallPart(BaseModel):
    type: Literal["tool-call"]
    toolCallId: str
    toolName: str
    args: Any
    providerMetadata: Optional[Any] = None

class LLMToolResultContentPart(BaseModel):
    type: Literal["text", "image"]
    text: Optional[str] = None
    data: Optional[str] = None
    mimeType: Optional[str] = None

class LLMToolResultPart(BaseModel):
    type: Literal["tool-result"]
    toolCallId: str
    toolName: str
    result: Any
    isError: Optional[bool] = None
    content: Optional[List[LLMToolResultContentPart]] = None
    providerMetadata: Optional[Any] = None

class LLMSystemMessage(BaseModel):
    role: Literal["system"]
    content: str

class LLMUserMessage(BaseModel):
    role: Literal["user"]
    content: List[LLMTextPart]

class LLMAssistantMessage(BaseModel):
    role: Literal["assistant"]
    content: List[Union[LLMTextPart, LLMToolCallPart]]

class LLMToolMessage(BaseModel):
    role: Literal["tool"]
    content: List[LLMToolResultPart]

LLMMessage = Union[
    LLMSystemMessage,
    LLMUserMessage,
    LLMAssistantMessage,
    LLMToolMessage,
]

class ChatRequest(BaseModel):
    """Request model for chat endpoints."""
    messages: List[LLMMessage]
    stream: Optional[bool] = False
    system: Optional[str] = None
    user_id: str