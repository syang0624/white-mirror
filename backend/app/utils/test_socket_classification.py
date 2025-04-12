import asyncio
import json
import websockets
import uuid

# Server info
WS_URL = "ws://localhost:8000/chat/ws"

# Test users (replace with actual UUIDs from your database)
USER1_ID = "249f0de2-390a-4549-a9f2-ddd2916fdfc9" 
USER2_ID = "0e2d25d3-ccee-4b84-9f97-172636348d5f"

# Test messages (varying levels of manipulative content)
TEST_MESSAGES = [
    "Hey, want to grab coffee later?",  # Should be non-manipulative
    "If you don't do this for me right now, I'll make sure you regret it.",  # Likely manipulative - intimidation
    "Everyone else has agreed to the plan, you're the only one holding us back.",  # Potential manipulation - shaming
    "I really need your help with this - I'm desperate and don't know who else to turn to.",  # Potential manipulation - playing victim
    "I know what's best for you, just trust me and do what I say.",  # Potential manipulation - persuasion/rationalization
]

async def test_classification():
    print(f"Connecting user 1: {USER1_ID}")
    user1_ws = await websockets.connect(f"{WS_URL}?user_id={USER1_ID}")
    
    print(f"Connecting user 2: {USER2_ID}")
    user2_ws = await websockets.connect(f"{WS_URL}?user_id={USER2_ID}")
    
    try:
        for i, message in enumerate(TEST_MESSAGES):
            print(f"\n--- Test {i+1}: Sending message from User 1 to User 2 ---")
            print(f"Message: {message}")
            
            # User 1 sends message to User 2
            await user1_ws.send(json.dumps({
                "receiver_id": USER2_ID,
                "content": message
            }))
            
            # Wait for receipt (User 1)
            receipt = await user1_ws.recv()
            receipt_data = json.loads(receipt)
            print(f"Receipt: {receipt_data}")
            
            # Wait for message (User 2)
            received = await user2_ws.recv()
            message_data = json.loads(received)
            print("\nCLASSIFICATION RESULTS:")
            print(f"Is manipulative: {message_data.get('is_manipulative', False)}")
            
            if message_data.get('is_manipulative', False):
                print(f"Techniques: {message_data.get('techniques', [])}")
                print(f"Vulnerabilities: {message_data.get('vulnerabilities', [])}")
            else:
                print("Message classified as non-manipulative")
            
            # Wait a bit before the next test
            await asyncio.sleep(1)
            
    finally:
        # Clean up
        await user1_ws.close()
        await user2_ws.close()

if __name__ == "__main__":
    asyncio.run(test_classification())