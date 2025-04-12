from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from enum import Enum
from app.db.models import ManipulativeTechniques, Vulnerabilities
from .base import BaseResponse

# Request Models
class BaseChatRequest(BaseModel):
    user_id: str

class AllStatisticRequest(BaseChatRequest):
    max_users: int = 10
    max_techniques: int = 5
    max_vulnerabilities: int = 5

class SingleStatisticRequest(BaseChatRequest):
    selected_user_id: str
    max_techniques: int = 5
    max_vulnerabilities: int = 5

class MessagesByTechniqueRequest(BaseChatRequest):
    selected_user_id: Optional[str] = None
    technique: ManipulativeTechniques
    limit: int = 10

class MessagesByVulnerabilityRequest(BaseChatRequest):
    selected_user_id: Optional[str] = None
    vulnerability: Vulnerabilities
    limit: int = 10

# Response Models
class TechniqueStatistics(BaseModel):
    name: str
    count: int
    percentage: float

class VulnerabilityStatistics(BaseModel):
    name: str
    count: int
    percentage: float

class StatisticResponseCore(BaseModel):
    person_id: str
    person_name: str
    total_messages: int
    manipulative_count: int
    manipulative_percentage: float
    techniques: List[TechniqueStatistics]
    vulnerabilities: List[VulnerabilityStatistics]

class AllStatisticResponseCore(BaseModel):
    statistics: List[StatisticResponseCore]

class ManipulativeMessage(BaseModel):
    message_id: str
    content: str
    timestamp: str
    techniques: Optional[List[str]] = None
    vulnerabilities: Optional[List[str]] = None

class MessagesByTechniqueResponseCore(BaseModel):
    technique: str
    messages: List[ManipulativeMessage]

class MessagesByVulnerabilityResponseCore(BaseModel):
    vulnerability: str
    messages: List[ManipulativeMessage]

# Final response models
class SingleStatisticResponse(BaseResponse[StatisticResponseCore], frozen=True):
    response: StatisticResponseCore

class AllStatisticResponse(BaseResponse[AllStatisticResponseCore], frozen=True):
    response: AllStatisticResponseCore

class MessagesByTechniqueResponse(BaseResponse[MessagesByTechniqueResponseCore], frozen=True):
    response: MessagesByTechniqueResponseCore

class MessagesByVulnerabilityResponse(BaseResponse[MessagesByVulnerabilityResponseCore], frozen=True):
    response: MessagesByVulnerabilityResponseCore