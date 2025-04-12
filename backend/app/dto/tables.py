from .base import BaseResponse
from pydantic import BaseModel

class TableRequest(BaseModel):
    table_name: str = ""  # Empty string means all tables

class TableResponseCore(BaseModel):
    message: str

class TableResponse(BaseResponse[TableResponseCore], frozen=True):
    response: TableResponseCore