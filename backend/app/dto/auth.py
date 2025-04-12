from pydantic import BaseModel
from typing import List
from .base import BaseResponse

class UserCreate(BaseModel):
    email: str
    name: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponseCore(BaseModel):
    user_id: str
    user_email: str
    user_name: str

class UserListResponseCore(BaseModel):
    users: List[UserResponseCore]

class UserResponse(BaseResponse[UserResponseCore], frozen=True):
    response: UserResponseCore

class UserListResponse(BaseResponse[UserListResponseCore], frozen=True):
    response: UserListResponseCore