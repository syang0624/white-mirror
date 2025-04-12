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
import time
from uuid import UUID

# Add parent directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Set API base URL
BASE_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000"

# Store session data
session = {
    "users": [],  # Will store multiple user credentials
    "active_ws": {}  # Will store active WebSocket connections by user_id
}

async def generate_random_user():
    """Generate random user data for testing"""
    random_string = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return {
        "email": f"test{random_string}@example.com",
        "name": f"Test User {random_string}",
        "password": "password123"
    }

async def create_test_users(count=5):
    """Create multiple test users"""
    logger.info(f"Creating {count} test users...")
    
    async with httpx.AsyncClient() as client:
        for i in range(count):
            user_data = await generate_random_user()
            
            # Sign up user
            response = await client.post(
                f"{BASE_URL}/auth/signup",
                json=user_data
            )
            
            response_data = response.json()
            if response.status_code == 201 or (isinstance(response_data, dict) and response_data.get("success") is True):
                logger.info(f"User {i+1} created: {user_data['email']}")
                
                if "response" in response_data and response_data["response"]:
                    # Store both credentials and response data
                    user_info = {
                        "credentials": user_data,
                        "user_data": response_data["response"]
                    }
                    session["users"].append(user_info)
                else:
                    logger.error(f"Unexpected response format: {response_data}")
            else:
                logger.error(f"Failed to create user: {response.text}")
    
    logger.info(f"Created {len(session['users'])} test users")
    return len(session["users"]) >= count

async def connect_user(user_info):
    """Connect a user to WebSocket"""
    user_id = user_info["user_data"]["user_id"]
    
    if user_id in session["active_ws"]:
        # Already connected
        return session["active_ws"][user_id]
    
    # Connect to WebSocket
    user_ws_url = f"{WS_URL}/chat/ws?user_id={user_id}"
    try:
        ws = await websockets.connect(user_ws_url)
        session["active_ws"][user_id] = ws
        logger.info(f"User {user_info['user_data']['user_name']} connected to WebSocket")
        return ws
    except Exception as e:
        logger.error(f"Failed to connect user {user_id} to WebSocket: {str(e)}")
        return None

async def disconnect_user(user_info):
    """Disconnect a user from WebSocket"""
    user_id = user_info["user_data"]["user_id"]
    
    if user_id in session["active_ws"]:
        try:
            await session["active_ws"][user_id].close()
            del session["active_ws"][user_id]
            logger.info(f"User {user_info['user_data']['user_name']} disconnected from WebSocket")
        except Exception as e:
            logger.error(f"Error disconnecting user {user_id}: {str(e)}")

async def send_message(sender_info, receiver_info, content):
    """Send a message from one user to another"""
    sender_id = sender_info["user_data"]["user_id"]
    receiver_id = receiver_info["user_data"]["user_id"]
    
    # Ensure sender is connected
    sender_ws = await connect_user(sender_info)
    if not sender_ws:
        return False
    
    # Ensure receiver is connected to receive the message
    receiver_ws = await connect_user(receiver_info)
    if not receiver_ws:
        return False
    
    # Send message
    message = {
        "receiver_id": receiver_id,
        "content": content
    }
    
    await sender_ws.send(json.dumps(message))
    
    # Wait for receipt
    try:
        receipt_data = await asyncio.wait_for(sender_ws.recv(), timeout=2.0)
        receipt = json.loads(receipt_data)
        
        # Wait for receiver to get message
        message_data = await asyncio.wait_for(receiver_ws.recv(), timeout=2.0)
        received = json.loads(message_data)
        
        return {
            "receipt": receipt,
            "received_message": received
        }
    except asyncio.TimeoutError:
        logger.error(f"Timeout waiting for message/receipt between {sender_id} and {receiver_id}")
        return False
    except Exception as e:
        logger.error(f"Error in message exchange: {str(e)}")
        return False

async def test_basic_chat_flow():
    """Test basic chat flow between users"""
    logger.info("Testing basic chat flow...")
    
    if len(session["users"]) < 2:
        logger.error("Not enough users for test")
        return False
    
    # Get first two users
    user1 = session["users"][0]
    user2 = session["users"][1]
    
    # User 1 sends message to User 2
    result1 = await send_message(
        user1, 
        user2, 
        f"Hello from {user1['user_data']['user_name']}! Time: {datetime.now().isoformat()}"
    )
    
    if not result1:
        logger.error("Failed to send message from user 1 to user 2")
        return False
    
    # User 2 replies to User 1
    result2 = await send_message(
        user2, 
        user1, 
        f"Hello back from {user2['user_data']['user_name']}! Time: {datetime.now().isoformat()}"
    )
    
    if not result2:
        logger.error("Failed to send message from user 2 to user 1")
        return False
    
    logger.info("Basic chat flow test passed")
    return True

async def test_extended_conversation():
    """Test a longer conversation between two users"""
    logger.info("Testing extended conversation...")
    
    if len(session["users"]) < 2:
        logger.error("Not enough users for test")
        return False
    
    # Get two users
    user1 = session["users"][0]
    user2 = session["users"][1]
    
    # Ensure both users are connected
    ws1 = await connect_user(user1)
    ws2 = await connect_user(user2)
    
    if not ws1 or not ws2:
        logger.error("Failed to connect users")
        return False
    
    # Send 20 messages back and forth
    for i in range(20):
        # User 1 sends message to User 2
        message = {
            "receiver_id": user2["user_data"]["user_id"],
            "content": f"Message {i+1} from {user1['user_data']['user_name']}"
        }
        await ws1.send(json.dumps(message))
        
        # Wait for receipt and message delivery
        receipt_data = await ws1.recv()  # Receipt
        message_data = await ws2.recv()  # Message
        
        # User 2 replies to User 1
        reply = {
            "receiver_id": user1["user_data"]["user_id"],
            "content": f"Reply {i+1} from {user2['user_data']['user_name']}"
        }
        await ws2.send(json.dumps(reply))
        
        # Wait for receipt and message delivery
        receipt_data = await ws2.recv()  # Receipt
        message_data = await ws1.recv()  # Message
    
    # Verify message history contains all messages
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/chat/messages?user_id={user1['user_data']['user_id']}&other_user_id={user2['user_data']['user_id']}"
        )
        
        if response.status_code == 200:
            messages = response.json()["response"]["messages"]
            logger.info(f"Retrieved {len(messages)} messages in extended conversation")
            
            if len(messages) >= 40:  # 20 messages each way
                logger.info("Extended conversation test passed")
                return True
            else:
                logger.error(f"Expected at least 40 messages, but got {len(messages)}")
                return False
        else:
            logger.error(f"Failed to get message history: {response.text}")
            return False

async def test_concurrent_conversations():
    """Test multiple parallel conversations"""
    logger.info("Testing concurrent conversations...")
    
    if len(session["users"]) < 4:
        logger.error("Not enough users for concurrent test")
        return False
    
    # Create pairs of users for parallel conversations
    pairs = [
        (session["users"][0], session["users"][1]),
        (session["users"][2], session["users"][3])
    ]
    
    # Function to run a conversation between two users
    async def run_conversation(user_a, user_b, message_count=10):
        # Connect both users
        ws_a = await connect_user(user_a)
        ws_b = await connect_user(user_b)
        
        if not ws_a or not ws_b:
            return False
        
        # Exchange messages
        for i in range(message_count):
            # User A to User B
            message_a = {
                "receiver_id": user_b["user_data"]["user_id"],
                "content": f"Concurrent test message {i+1} from {user_a['user_data']['user_name']}"
            }
            await ws_a.send(json.dumps(message_a))
            await ws_a.recv()  # Receipt
            await ws_b.recv()  # Message
            
            # User B to User A
            message_b = {
                "receiver_id": user_a["user_data"]["user_id"],
                "content": f"Concurrent test reply {i+1} from {user_b['user_data']['user_name']}"
            }
            await ws_b.send(json.dumps(message_b))
            await ws_b.recv()  # Receipt
            await ws_a.recv()  # Message
        
        return True
    
    # Run conversations in parallel
    tasks = [run_conversation(pair[0], pair[1]) for pair in pairs]
    results = await asyncio.gather(*tasks)
    
    # Check if all conversations succeeded
    if all(results):
        logger.info("Concurrent conversations test passed")
        return True
    else:
        logger.error("One or more concurrent conversations failed")
        return False

async def test_reconnection():
    """Test WebSocket reconnection"""
    logger.info("Testing WebSocket reconnection...")
    
    if len(session["users"]) < 2:
        logger.error("Not enough users for reconnection test")
        return False
    
    user1 = session["users"][0]
    user2 = session["users"][1]
    
    # Connect first time
    user1_ws = await connect_user(user1)
    if not user1_ws:
        return False
    
    # Ensure user2 is connected to receive messages
    user2_ws = await connect_user(user2)
    if not user2_ws:
        return False
    
    # Send a message before disconnect
    message = {
        "receiver_id": user2["user_data"]["user_id"],
        "content": "Message before disconnect"
    }
    await user1_ws.send(json.dumps(message))
    await user1_ws.recv()  # Receipt
    await user2_ws.recv()  # Message
    
    # Abruptly close connection
    await disconnect_user(user1)
    logger.info("First connection closed")
    
    # Wait a moment
    await asyncio.sleep(1)
    
    # Reconnect
    user1_ws = await connect_user(user1)
    if not user1_ws:
        logger.error("Failed to reconnect")
        return False
    
    logger.info("Reconnected")
    
    # Send another message
    message = {
        "receiver_id": user2["user_data"]["user_id"],
        "content": "Message after reconnect"
    }
    await user1_ws.send(json.dumps(message))
    receipt_data = await user1_ws.recv()
    await user2_ws.recv()  # Message
    
    # Check if receipt was received properly
    receipt = json.loads(receipt_data)
    if receipt["type"] == "receipt":
        logger.info("Reconnection test passed")
        return True
    else:
        logger.error("Failed to get receipt after reconnection")
        return False

async def test_load():
    """Load test with multiple users and messages"""
    logger.info("Running load test...")
    
    # Create additional users if needed to have at least 10
    while len(session["users"]) < 10:
        user_created = await create_test_users(1)
        if not user_created:
            logger.error("Failed to create enough users for load test")
            return False
    
    # Parameters
    test_users = session["users"][:10]  # Use up to 10 users
    messages_per_user = 10
    
    # Connect all users
    for user in test_users:
        await connect_user(user)
    
    # Function for a user to send messages
    async def user_send_messages(sender, recipients, count):
        sender_ws = session["active_ws"].get(sender["user_data"]["user_id"])
        if not sender_ws:
            return False
        
        for i in range(count):
            # Send to a random recipient
            recipient = random.choice(recipients)
            receiver_id = recipient["user_data"]["user_id"]
            
            message = {
                "receiver_id": receiver_id,
                "content": f"Load test message {i+1} from {sender['user_data']['user_name']}"
            }
            
            try:
                await sender_ws.send(json.dumps(message))
                await asyncio.wait_for(sender_ws.recv(), timeout=2.0)  # Receipt
            except Exception as e:
                logger.error(f"Error in load test message: {str(e)}")
                return False
        
        return True
    
    # Start tasks for all users
    tasks = []
    for sender in test_users:
        # Create list of possible recipients (all users except sender)
        recipients = [u for u in test_users if u["user_data"]["user_id"] != sender["user_data"]["user_id"]]
        tasks.append(user_send_messages(sender, recipients, messages_per_user))
    
    # Run all sending tasks
    results = await asyncio.gather(*tasks)
    
    # Check results
    if all(results):
        logger.info(f"Load test complete: {len(test_users)} users each sent {messages_per_user} messages")
        return True
    else:
        logger.error("Load test failures detected")
        return False

async def test_group_behavior():
    """Test multiple users receiving the same messages (simulating group chat behavior)"""
    logger.info("Testing group-like message pattern...")
    
    if len(session["users"]) < 5:
        logger.error("Not enough users for group test")
        return False
    
    # Select users for the test
    sender = session["users"][0]
    receivers = session["users"][1:5]  # 4 receivers
    
    # Connect all users
    sender_ws = await connect_user(sender)
    if not sender_ws:
        return False
    
    receiver_connections = []
    for receiver in receivers:
        ws = await connect_user(receiver)
        if not ws:
            return False
        receiver_connections.append((receiver, ws))
    
    # Send messages to each receiver
    for i in range(5):  # 5 messages
        # Send the same message to all receivers
        for receiver, _ in receiver_connections:
            message = {
                "receiver_id": receiver["user_data"]["user_id"],
                "content": f"Group test message {i+1} to everyone"
            }
            await sender_ws.send(json.dumps(message))
            await sender_ws.recv()  # Receipt
        
        # Let all receivers process their messages
        for _, ws in receiver_connections:
            await ws.recv()  # Message
    
    # Verify message history for each receiver
    async with httpx.AsyncClient() as client:
        for receiver in receivers:
            response = await client.get(
                f"{BASE_URL}/chat/messages?user_id={receiver['user_data']['user_id']}&other_user_id={sender['user_data']['user_id']}"
            )
            
            if response.status_code != 200:
                logger.error(f"Failed to get messages for receiver {receiver['user_data']['user_name']}")
                return False
            
            messages = response.json()["response"]["messages"]
            if len(messages) < 5:
                logger.error(f"Expected at least 5 messages for {receiver['user_data']['user_name']}, got {len(messages)}")
                return False
    
    logger.info("Group behavior test passed")
    return True

async def cleanup():
    """Close all WebSocket connections"""
    logger.info("Cleaning up connections...")
    
    for user_id, ws in list(session["active_ws"].items()):
        try:
            await ws.close()
        except:
            pass
    
    session["active_ws"] = {}
    logger.info("All connections closed")

async def run_all_tests():
    """Run all multi-conversation tests"""
    logger.info("Starting multi-conversation tests...")
    
    # Create test users if needed
    if len(session["users"]) < 5:
        if not await create_test_users(5):
            logger.error("Failed to create test users, stopping tests")
            return
    
    try:
        # Basic tests
        if not await test_basic_chat_flow():
            logger.error("Basic chat flow test failed, stopping tests")
            return
        
        # Extended conversation
        if not await test_extended_conversation():
            logger.error("Extended conversation test failed, stopping tests")
            return
        
        # Concurrent conversations
        if not await test_concurrent_conversations():
            logger.error("Concurrent conversations test failed, stopping tests")
            return
        
        # Reconnection
        if not await test_reconnection():
            logger.error("Reconnection test failed, stopping tests")
            return
        
        # Group behavior
        if not await test_group_behavior():
            logger.error("Group behavior test failed, stopping tests")
            return
        
        # Load test
        if not await test_load():
            logger.error("Load test failed, stopping tests")
            return
        
        logger.info("All multi-conversation tests completed successfully!")
        
    finally:
        # Always clean up connections
        await cleanup()

if __name__ == "__main__":
    asyncio.run(run_all_tests())