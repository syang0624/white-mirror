import sys
import os
from fastapi.testclient import TestClient
from loguru import logger
from dotenv import load_dotenv
import asyncio
from contextlib import asynccontextmanager
from sqlalchemy import text

load_dotenv()

# Add parent directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Set environment variables if not already set
if "POSTGRES_HOST" not in os.environ:
    raise ValueError("Environment variables are not set")

# Let's create a direct connection to the database instead of using the endpoints
from app.db.postgres import Postgres, ConnParams
from app.db.models import Base

async def setup_database_direct():
    """
    Set up database directly using Postgres connection rather than API endpoints
    """
    logger.info("Setting up database directly...")
    
    # Get database parameters from environment
    db_params = ConnParams(
        db_user=os.environ["POSTGRES_USER"],
        db_pass=os.environ["POSTGRES_PASS"],
        db_host=os.environ["POSTGRES_HOST"],
        db_name=os.environ["POSTGRES_DB"],
        db_port=int(os.environ["POSTGRES_PORT"]),
    )
    
    async with Postgres.init(**db_params) as db_client:
        # Check if tables already exist
        try:
            async with db_client.session_autocommit() as db:
                # Query to list all tables in the schema
                query = text("""
                    SELECT tablename FROM pg_tables 
                    WHERE schemaname = 'public'
                """)
                result = await db.execute(query)
                tables = [row[0] for row in result.fetchall()]
                
                if tables:
                    logger.info(f"Tables already exist: {', '.join(tables)}")
                    user_input = input("Tables already exist. Do you want to recreate them? (y/N): ")
                    if user_input.lower() not in ["y", "yes"]:
                        logger.info("Setup aborted by user")
                        return
                    
                    # If user wants to recreate, drop existing tables
                    logger.info("Dropping existing tables...")
                    await db_client.drop_table(base=Base, table_name=None)
                
                # Create all tables
                logger.info("Creating tables...")
                await db_client.create_table(base=Base, table_name=None)
                
                # Verify tables were created
                query = text("""
                    SELECT tablename FROM pg_tables 
                    WHERE schemaname = 'public'
                """)
                result = await db.execute(query)
                tables = [row[0] for row in result.fetchall()]
                
                if tables:
                    logger.info(f"Setup completed successfully. Tables created: {', '.join(tables)}")
                else:
                    logger.warning("Setup completed but no tables were found during verification")
        
        except Exception as e:
            logger.error(f"Error during database setup: {str(e)}")

if __name__ == "__main__":
    asyncio.run(setup_database_direct())