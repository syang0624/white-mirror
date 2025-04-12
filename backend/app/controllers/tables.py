
from fastapi import APIRouter, Request, status
from sqlalchemy import text

from app.core.context import get_postgres_client
from app.dto.tables import TableRequest, TableResponse, TableResponseCore
from app.db.models import Base
from loguru import logger

router = APIRouter()

@router.post("/create-table", status_code=status.HTTP_201_CREATED)
async def create_table(request: TableRequest, req: Request):
    db_client = get_postgres_client(req)
    
    try:
        if request.table_name:
            # Create specific table
            await db_client.create_table(base=Base, table_name=request.table_name)
            message = f"Table '{request.table_name}' created successfully."
        else:
            # Create all tables
            await db_client.create_table(base=Base, table_name=None)
            message = "All tables created successfully."
        
        return TableResponse(
            response=TableResponseCore(message=message)
        )
    except Exception as e:
        return TableResponse(
            code=500,
            success=False,
            message=f"Failed to create table(s): {str(e)}",
            response=TableResponseCore(message=f"{str(e)}")
        )

@router.post("/delete-table", status_code=status.HTTP_200_OK)
async def delete_table(request: TableRequest, req: Request):
    db_client = get_postgres_client(req)
    
    try:
        if request.table_name:
            # Delete specific table
            await db_client.drop_table(base=Base, table_name=request.table_name)
            message = f"Table '{request.table_name}' deleted successfully."
        else:
            # Delete all tables
            await db_client.drop_table(base=Base, table_name=None)
            message = "All tables deleted successfully."
        
        return TableResponse(
            response=TableResponseCore(message=message)
        )
    except Exception as e:
        return TableResponse(
            code=500,
            success=False,
            message=f"Failed to delete table(s): {str(e)}",
            response=TableResponseCore(message=f"{str(e)}")
        )

@router.get("/check-tables")
async def check_tables(req: Request):
    """Check if tables exist in the database."""
    db_client = get_postgres_client(req)
    
    try:
        async with db_client.session_autocommit() as db:
            # Query to list all tables in the schema
            query = text("""
                SELECT tablename FROM pg_tables 
                WHERE schemaname = 'public'
            """)
            result = await db.execute(query)
            tables = [row[0] for row in result.fetchall()]
            
            return {
                "success": True,
                "tables_exist": len(tables) > 0,
                "tables": tables
            }
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }
