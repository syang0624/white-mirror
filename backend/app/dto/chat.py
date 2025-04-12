from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from .base import BaseResponse

# Request Models
class GetMessagesRequest(BaseModel):
    user_id: str
    other_user_id: str
    limit: int = 50

# Response Models
class MessageCore(BaseModel):
    id: str  
    sender_id: str 
    sender_name: str
    content: str
    timestamp: str
    is_sent_by_me: bool
    is_manipulative: Optional[bool] = False
    techniques: Optional[List[str]] = None
    vulnerabilities: Optional[List[str]] = None

class MessagesResponseCore(BaseModel):
    messages: List[MessageCore]

class MessagesResponse(BaseResponse[MessagesResponseCore], frozen=True):
    response: MessagesResponseCore

# WebSocket message models
class WebSocketErrorResponse(BaseModel):
    type: str = "error"
    message: str

class WebSocketReceiptResponse(BaseModel):
    type: str = "receipt"
    message_id: str
    delivered: bool
    timestamp: str