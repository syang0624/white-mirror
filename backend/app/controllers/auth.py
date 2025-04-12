from fastapi import APIRouter, HTTPException, status, Request
import hashlib
from uuid import UUID, uuid4
from sqlalchemy import select

from app.db.models import User
from app.core.context import get_postgres_client
from app.dto.auth import (
    UserCreate, 
    UserLogin, 
    UserResponse, 
    UserResponseCore,
    UserListResponse,
    UserListResponseCore
)

router = APIRouter()

# Simple password hashing
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# Signup endpoint
@router.post("/signup")
async def signup(user_data: UserCreate, request: Request):
    db_client = get_postgres_client(request)
    
    async with db_client.session_autocommit() as db:
        # Check if email already exists
        stmt = select(User).where(User.user_email == user_data.email)
        result = await db_client.select(stmt)
        existing_user = result.first()
        
        if existing_user:
            return UserResponse(
                code=status.HTTP_400_BAD_REQUEST,
                success=False,
                message="Email already registered",
                response=None
            )
        
        # Create new user with UUID
        user_id = uuid4()
        new_user = User(
            user_id=user_id,
            user_email=user_data.email,
            user_name=user_data.name,
            user_password=hash_password(user_data.password)
        )
        
        await db_client.insert([new_user])
        
        # Return response with UUID converted to string
        return UserResponse(
            code=status.HTTP_201_CREATED,
            message="User created successfully",
            response=UserResponseCore(
                user_id=str(user_id),  # Convert UUID to string for API response
                user_email=user_data.email,
                user_name=user_data.name
            )
        )

# Login endpoint
@router.post("/login")
async def login(user_data: UserLogin, request: Request):
    db_client = get_postgres_client(request)
    
    async with db_client.session_autocommit() as db:
        # Find user by email
        stmt = select(User).where(User.user_email == user_data.email)
        result = await db_client.select(stmt)
        user_row = result.first()
        
        # Check if user exists
        if not user_row:
            # Create an error UserResponseCore with string UUID
            dummy_uuid = uuid4()
            error_response = UserResponseCore(
                user_id=str(dummy_uuid),  # Convert UUID to string
                user_email="",
                user_name=""
            )
            return UserResponse(
                code=status.HTTP_401_UNAUTHORIZED,
                success=False,
                message="Incorrect email or password",
                response=error_response
            )
        
        try:
            # Assuming it's a SQLAlchemy row object with a User entity
            user = user_row.User if hasattr(user_row, 'User') else user_row
            
            # Check password
            stored_password = user.user_password
            if hash_password(user_data.password) != stored_password:
                # Create an error UserResponseCore with string UUID
                dummy_uuid = uuid4()
                error_response = UserResponseCore(
                    user_id=str(dummy_uuid),  # Convert UUID to string
                    user_email="",
                    user_name=""
                )
                return UserResponse(
                    code=status.HTTP_401_UNAUTHORIZED,
                    success=False,
                    message="Incorrect email or password",
                    response=error_response
                )
            
            # Successful login - convert UUID to string for response
            return UserResponse(
                message="Login successful",
                response=UserResponseCore(
                    user_id=str(user.user_id),  # Convert UUID to string
                    user_email=user.user_email,
                    user_name=user.user_name
                )
            )
            
        except Exception as e:
            print(f"Exception accessing user data: {str(e)}")
            dummy_uuid = uuid4()
            error_response = UserResponseCore(
                user_id=str(dummy_uuid),  # Convert UUID to string
                user_email="",
                user_name=""
            )
            return UserResponse(
                code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                success=False,
                message=f"Internal server error: {str(e)}",
                response=error_response
            )

# Get all users endpoint (for finding people to chat with)
@router.get("/users")
async def get_users(request: Request):
    db_client = get_postgres_client(request)
    
    async with db_client.session_autocommit() as db:
        try:
            stmt = select(User)
            result = await db_client.select(stmt)
            users = result.all()
            
            # Process users in a way that handles different SQLAlchemy result formats
            user_list = []
            for user_row in users:
                try:
                    # Try to access as User object directly
                    user = user_row.User if hasattr(user_row, 'User') else user_row
                    
                    user_list.append(
                        UserResponseCore(
                            user_id=str(user.user_id),  # Convert UUID to string
                            user_email=user.user_email,
                            user_name=user.user_name
                        )
                    )
                except (AttributeError, KeyError) as e:
                    print(f"Error accessing user attributes: {str(e)}")
                    # Try alternative access methods
                    try:
                        # Try as dictionary items
                        if hasattr(user_row, '_mapping'):
                            mapping = user_row._mapping
                            user_id = mapping.get('user_id', None)
                            user_email = mapping.get('user_email', None)
                            user_name = mapping.get('user_name', None)
                        elif hasattr(user_row, '__getitem__'):
                            user_id = user_row['user_id']
                            user_email = user_row['user_email'] 
                            user_name = user_row['user_name']
                        else:
                            # Skip this user if we can't access its data
                            continue
                            
                        user_list.append(
                            UserResponseCore(
                                user_id=str(user_id),  # Convert UUID to string
                                user_email=user_email,
                                user_name=user_name
                            )
                        )
                    except Exception as inner_e:
                        print(f"Failed to extract user data: {str(inner_e)}")
                        # Skip this user
                        continue
                        
            return UserListResponse(
                message="Users retrieved successfully",
                response=UserListResponseCore(users=user_list)
            )
            
        except Exception as e:
            print(f"Exception in get_users: {str(e)}")
            # Return an empty list rather than failing
            return UserListResponse(
                message="Error retrieving users",
                response=UserListResponseCore(users=[])
            )

# Get user by ID
@router.get("/users/{user_id}")
async def get_user(user_id: str, request: Request):
    db_client = get_postgres_client(request)
    
    try:
        # Convert string to UUID for database query
        user_uuid = UUID(user_id)
        
        async with db_client.session_autocommit() as db:
            stmt = select(User).where(User.user_id == user_uuid)
            user_result = await db_client.select(stmt)
            user = user_result.first()
            
            if not user:
                return UserResponse(
                    code=status.HTTP_404_NOT_FOUND,
                    success=False,
                    message="User not found",
                    response=None
                )
                
            return UserResponse(
                message="User retrieved successfully",
                response=UserResponseCore(
                    user_id=str(user.user_id),  # Convert UUID to string
                    user_email=user.user_email,
                    user_name=user.user_name
                )
            )
    except ValueError:
        # Handle invalid UUID format
        return UserResponse(
            code=status.HTTP_400_BAD_REQUEST,
            success=False,
            message="Invalid user ID format",
            response=None
        )