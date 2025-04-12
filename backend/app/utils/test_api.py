import asyncio
import json
import sys
import os
import random
import string
import websockets
from loguru import logger
import httpx
from datetime import datetime

# Add parent directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Set API base URL
BASE_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000"

# Store session data
session = {
    "user1": None,
    "user2": None
}

async def generate_random_user():
    """Generate random user data for testing"""
    random_string = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return {
        "email": f"test{random_string}@example.com",
        "name": f"Test User {random_string}",
        "password": "password123"
    }

async def test_sign_up():
    """Test user signup"""
    logger.info("Testing signup API...")
    
    async with httpx.AsyncClient() as client:
        # Create two random users
        session["user1_data"] = await generate_random_user()
        session["user2_data"] = await generate_random_user()
        
        # Sign up first user
        response = await client.post(
            f"{BASE_URL}/auth/signup",
            json=session["user1_data"]
        )
        
        response_data = response.json()
        # Check if the response indicates success (either status code 201 or success field is true)
        if response.status_code == 201 or (isinstance(response_data, dict) and response_data.get("success") is True):
            logger.info(f"User 1 created successfully: {session['user1_data']['email']}")
            # Extract user information from the response
            if "response" in response_data and response_data["response"]:
                session["user1"] = response_data["response"]
                # No need to convert user_id to string - it should already be a string
                logger.info(f"User 1 ID (string): {session['user1']['user_id']}")
            else:
                logger.error(f"Response format unexpected: {response_data}")
                return False
        else:
            logger.error(f"Failed to create user 1: {response.text}")
            return False
        
        # Sign up second user
        response = await client.post(
            f"{BASE_URL}/auth/signup",
            json=session["user2_data"]
        )
        
        response_data = response.json()
        if response.status_code == 201 or (isinstance(response_data, dict) and response_data.get("success") is True):
            logger.info(f"User 2 created successfully: {session['user2_data']['email']}")
            if "response" in response_data and response_data["response"]:
                session["user2"] = response_data["response"]
                # No need to convert user_id to string - it should already be a string
                logger.info(f"User 2 ID (string): {session['user2']['user_id']}")
            else:
                logger.error(f"Response format unexpected: {response_data}")
                return False
        else:
            logger.error(f"Failed to create user 2: {response.text}")
            return False
        
        return True

async def test_login():
    """Test login API"""
    logger.info("Testing login API...")
    
    async with httpx.AsyncClient() as client:
        # Login with user 1
        login_data = {
            "email": session["user1_data"]["email"],
            "password": session["user1_data"]["password"]
        }
        
        response = await client.post(
            f"{BASE_URL}/auth/login",
            json=login_data
        )
        
        if response.status_code == 200:
            logger.info(f"User 1 logged in successfully")
            session["user1"] = response.json()["response"]
            # Verify the user ID is a string
            logger.info(f"User 1 ID (string): {session['user1']['user_id']}")
        else:
            logger.error(f"Failed to login as user 1: {response.text}")
            return False
        
        # Login with user 2
        login_data = {
            "email": session["user2_data"]["email"],
            "password": session["user2_data"]["password"]
        }
        
        response = await client.post(
            f"{BASE_URL}/auth/login",
            json=login_data
        )
        
        if response.status_code == 200:
            logger.info(f"User 2 logged in successfully")
            session["user2"] = response.json()["response"]
            # Verify the user ID is a string
            logger.info(f"User 2 ID (string): {session['user2']['user_id']}")
        else:
            logger.error(f"Failed to login as user 2: {response.text}")
            return False
        
        return True

async def test_get_users():
    """Test get users API"""
    logger.info("Testing get users API...")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/auth/users")
        
        if response.status_code == 200:
            users = response.json()["response"]["users"]
            logger.info(f"Retrieved {len(users)} users")
            
            # Verify our created users are in the list
            user1_found = False
            user2_found = False
            
            for user in users:
                # The user_id should be a string
                if user["user_id"] == session["user1"]["user_id"]:
                    user1_found = True
                if user["user_id"] == session["user2"]["user_id"]:
                    user2_found = True
            
            if user1_found and user2_found:
                logger.info("Both test users found in users list")
                return True
            else:
                logger.error("Test users not found in users list")
                return False
        else:
            logger.error(f"Failed to get users: {response.text}")
            return False

async def send_messages():
    """Test sending messages via WebSocket"""
    logger.info("Testing WebSocket chat...")
    
    # Connect as user 1 - user_id is already a string
    user1_ws_url = f"{WS_URL}/chat/ws?user_id={session['user1']['user_id']}"
    user2_ws_url = f"{WS_URL}/chat/ws?user_id={session['user2']['user_id']}"
    
    logger.info(f"Connecting to WebSocket with user1 ID: {session['user1']['user_id']}")
    logger.info(f"Connecting to WebSocket with user2 ID: {session['user2']['user_id']}")
    
    async with websockets.connect(user1_ws_url) as user1_ws, \
               websockets.connect(user2_ws_url) as user2_ws:
        
        logger.info("WebSocket connections established")
        
        # User 1 sends message to user 2
        # receiver_id is already a string
        message1 = {
            "receiver_id": session["user2"]["user_id"],
            "content": f"Hello from user 1! Time: {datetime.now().isoformat()}"
        }
        
        await user1_ws.send(json.dumps(message1))
        logger.info(f"User 1 sent message to user ID: {message1['receiver_id']}")
        logger.info(f"Message content: {message1['content']}")
        
        # Wait for receipt
        receipt = await user1_ws.recv()
        receipt_data = json.loads(receipt)
        logger.info(f"User 1 received receipt: {receipt_data}")
        
        # Wait for user 2 to receive the message
        user2_received = await user2_ws.recv()
        user2_message = json.loads(user2_received)
        logger.info(f"User 2 received message: {user2_message}")
        
        # User 2 sends message back to user 1
        message2 = {
            "receiver_id": session["user1"]["user_id"],
            "content": f"Hello back from user 2! Time: {datetime.now().isoformat()}"
        }
        
        await user2_ws.send(json.dumps(message2))
        logger.info(f"User 2 sent message to user ID: {message2['receiver_id']}")
        logger.info(f"Message content: {message2['content']}")
        
        # Wait for receipt
        receipt = await user2_ws.recv()
        receipt_data = json.loads(receipt)
        logger.info(f"User 2 received receipt: {receipt_data}")
        
        # Wait for user 1 to receive the message
        user1_received = await user1_ws.recv()
        user1_message = json.loads(user1_received)
        logger.info(f"User 1 received message: {user1_message}")
        
        return True

async def test_get_messages():
    """Test getting message history"""
    logger.info("Testing get messages API...")
    
    async with httpx.AsyncClient() as client:
        # Get messages between user 1 and user 2
        # user_id and other_user_id are already strings
        response = await client.get(
            f"{BASE_URL}/chat/messages?user_id={session['user1']['user_id']}&other_user_id={session['user2']['user_id']}"
        )
        
        if response.status_code == 200:
            messages = response.json()["response"]["messages"]
            logger.info(f"Retrieved {len(messages)} messages between users")
            
            # Verify we have at least the two messages we sent
            if len(messages) >= 2:
                logger.info("Message history contains our test messages")
                
                # Print message contents and verify IDs are strings
                for i, msg in enumerate(messages):
                    logger.info(f"Message {i+1}: {msg['content']}")
                    logger.info(f"From user ID (string): {msg['sender_id']}")
                
                return True
            else:
                logger.error("Message history doesn't contain our test messages")
                return False
        else:
            logger.error(f"Failed to get message history: {response.text}")
            return False

async def run_all_tests():
    """Run all API tests in sequence"""
    logger.info("Starting API tests...")
    
    # Test signup
    if not await test_sign_up():
        logger.error("Signup test failed, stopping tests")
        return
    
    # Test login
    if not await test_login():
        logger.error("Login test failed, stopping tests")
        return
    
    # Test get users
    if not await test_get_users():
        logger.error("Get users test failed, stopping tests")
        return
    
    # Test WebSocket messaging
    if not await send_messages():
        logger.error("WebSocket messaging test failed, stopping tests")
        return
    
    # Test get message history
    if not await test_get_messages():
        logger.error("Get message history test failed, stopping tests")
        return
    
    logger.info("All tests completed successfully!")

if __name__ == "__main__":
    asyncio.run(run_all_tests())