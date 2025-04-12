from typing import Generic, TypeVar

from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

T = TypeVar("T")
class BaseResponse(BaseModel, Generic[T], frozen=True):
    code: int = 0
    success: bool = True
    message: str = "success"
    response: T | None

    def render_json(self, status_code: int = 200):
        return JSONResponse(content=jsonable_encoder(self), status_code=status_code)
