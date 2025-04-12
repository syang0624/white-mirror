import asyncio
import sys
import os
import json
import httpx
from loguru import logger
from uuid import UUID
from app.db.models import ManipulativeTechniques, Vulnerabilities

# Add parent directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Set API base URL
BASE_URL = "http://localhost:8000"

# Store session data from previous test
USER1_ID = "249f0de2-390a-4549-a9f2-ddd2916fdfc9"
USER2_ID = "0e2d25d3-ccee-4b84-9f97-172636348d5f"

async def test_all_statistics():
    """Test all statistics endpoint"""
    logger.info("\nTesting all statistics endpoint...")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/statistics/all_statistics",
            json={
                "user_id": USER2_ID,
                "max_users": 10,
                "max_techniques": 5,
                "max_vulnerabilities": 5
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            # Print full JSON response
            logger.info(f"Full JSON response: {json.dumps(result, indent=2)}")
            
            if result.get("success"):
                stats = result["response"]["statistics"]
                logger.info(f"Retrieved statistics for {len(stats)} users")
                
                for user_stat in stats:
                    logger.info(f"\nUser: {user_stat['person_name']} (ID: {user_stat['person_id']})")
                    logger.info(f"Total messages: {user_stat['total_messages']}")
                    logger.info(f"Manipulative messages: {user_stat['manipulative_count']} ({user_stat['manipulative_percentage']*100:.1f}%)")
                    
                    if user_stat["techniques"]:
                        logger.info("Top techniques:")
                        for tech in user_stat["techniques"]:
                            logger.info(f"  - {tech['name']}: {tech['count']} ({tech['percentage']*100:.1f}%)")
                    
                    if user_stat["vulnerabilities"]:
                        logger.info("Top vulnerabilities:")
                        for vuln in user_stat["vulnerabilities"]:
                            logger.info(f"  - {vuln['name']}: {vuln['count']} ({vuln['percentage']*100:.1f}%)")
                
                return True
            else:
                logger.error(f"API error: {result.get('message')}")
                return False
        else:
            logger.error(f"Failed to get all statistics: {response.text}")
            return False

async def test_single_statistics():
    """Test single statistics endpoint"""
    logger.info("\nTesting single statistics endpoint...")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/statistics/single_statistics",
            json={
                "user_id": USER2_ID,
                "selected_user_id": USER1_ID,
                "max_techniques": 5,
                "max_vulnerabilities": 5
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            # Print full JSON response
            logger.info(f"Full JSON response: {json.dumps(result, indent=2)}")
            
            if result.get("success"):
                user_stat = result["response"]
                logger.info(f"\nUser: {user_stat['person_name']} (ID: {user_stat['person_id']})")
                logger.info(f"Total messages: {user_stat['total_messages']}")
                logger.info(f"Manipulative messages: {user_stat['manipulative_count']} ({user_stat['manipulative_percentage']*100:.1f}%)")
                
                if user_stat["techniques"]:
                    logger.info("Techniques:")
                    for tech in user_stat["techniques"]:
                        logger.info(f"  - {tech['name']}: {tech['count']} ({tech['percentage']*100:.1f}%)")
                
                if user_stat["vulnerabilities"]:
                    logger.info("Vulnerabilities:")
                    for vuln in user_stat["vulnerabilities"]:
                        logger.info(f"  - {vuln['name']}: {vuln['count']} ({vuln['percentage']*100:.1f}%)")
                
                return True
            else:
                logger.error(f"API error: {result.get('message')}")
                return False
        else:
            logger.error(f"Failed to get single statistics: {response.text}")
            return False

async def test_messages_by_technique():
    """Test messages by technique endpoint"""
    logger.info("\nTesting messages by technique endpoint...")
    
    async with httpx.AsyncClient() as client:
        # Try with Persuasion or Seduction technique
        response = await client.post(
            f"{BASE_URL}/statistics/messages_by_technique",
            json={
                "user_id": USER2_ID,
                "selected_user_id": USER1_ID,
                "technique": "Persuasion or Seduction",
                "limit": 10
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            # Print full JSON response
            logger.info(f"Full JSON response: {json.dumps(result, indent=2)}")
            
            if result.get("success"):
                message_data = result["response"]
                logger.info(f"Technique: {message_data['technique']}")
                logger.info(f"Found {len(message_data['messages'])} messages")
                
                for i, msg in enumerate(message_data['messages']):
                    logger.info(f"\nMessage {i+1}:")
                    logger.info(f"Content: {msg['content']}")
                    logger.info(f"Timestamp: {msg['timestamp']}")
                    logger.info(f"Techniques: {', '.join(msg['techniques']) if msg['techniques'] else 'None'}")
                    logger.info(f"Vulnerabilities: {', '.join(msg['vulnerabilities']) if msg['vulnerabilities'] else 'None'}")
                
                return True
            else:
                logger.error(f"API error: {result.get('message')}")
                return False
        else:
            logger.error(f"Failed to get messages by technique: {response.text}")
            return False

async def test_messages_by_vulnerability():
    """Test messages by vulnerability endpoint"""
    logger.info("\nTesting messages by vulnerability endpoint...")
    
    async with httpx.AsyncClient() as client:
        # Try with Dependency vulnerability
        response = await client.post(
            f"{BASE_URL}/statistics/messages_by_vulnerability",
            json={
                "user_id": USER2_ID,
                "selected_user_id": USER1_ID,
                "vulnerability": "Dependency",
                "limit": 10
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            # Print full JSON response
            logger.info(f"Full JSON response: {json.dumps(result, indent=2)}")
            
            if result.get("success"):
                message_data = result["response"]
                logger.info(f"Vulnerability: {message_data['vulnerability']}")
                logger.info(f"Found {len(message_data['messages'])} messages")
                
                for i, msg in enumerate(message_data['messages']):
                    logger.info(f"\nMessage {i+1}:")
                    logger.info(f"Content: {msg['content']}")
                    logger.info(f"Timestamp: {msg['timestamp']}")
                    logger.info(f"Techniques: {', '.join(msg['techniques']) if msg['techniques'] else 'None'}")
                    logger.info(f"Vulnerabilities: {', '.join(msg['vulnerabilities']) if msg['vulnerabilities'] else 'None'}")
                
                return True
            else:
                logger.error(f"API error: {result.get('message')}")
                return False
        else:
            logger.error(f"Failed to get messages by vulnerability: {response.text}")
            return False

async def test_all_messages_by_technique():
    """Test all messages by technique endpoint (no specific user)"""
    logger.info("\nTesting all messages by technique endpoint...")
    
    async with httpx.AsyncClient() as client:
        # Try with Rationalization technique (which should have messages based on the test output)
        response = await client.post(
            f"{BASE_URL}/statistics/messages_by_technique",
            json={
                "user_id": USER2_ID,
                "technique": "Rationalization",
                "limit": 10
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            # Print full JSON response
            logger.info(f"Full JSON response: {json.dumps(result, indent=2)}")
            
            if result.get("success"):
                message_data = result["response"]
                logger.info(f"Technique: {message_data['technique']}")
                logger.info(f"Found {len(message_data['messages'])} messages")
                
                for i, msg in enumerate(message_data['messages']):
                    logger.info(f"\nMessage {i+1}:")
                    logger.info(f"Content: {msg['content']}")
                    logger.info(f"Timestamp: {msg['timestamp']}")
                    logger.info(f"Techniques: {', '.join(msg['techniques']) if msg['techniques'] else 'None'}")
                    logger.info(f"Vulnerabilities: {', '.join(msg['vulnerabilities']) if msg['vulnerabilities'] else 'None'}")
                
                return True
            else:
                logger.error(f"API error: {result.get('message')}")
                return False
        else:
            logger.error(f"Failed to get all messages by technique: {response.text}")
            return False

async def test_all_messages_by_vulnerability():
    """Test all messages by vulnerability endpoint (no specific user)"""
    logger.info("\nTesting all messages by vulnerability endpoint...")
    
    async with httpx.AsyncClient() as client:
        # Try with Naivete vulnerability
        response = await client.post(
            f"{BASE_URL}/statistics/messages_by_vulnerability",
            json={
                "user_id": USER2_ID,
                "vulnerability": "Naivete",
                "limit": 10
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            # Print full JSON response
            logger.info(f"Full JSON response: {json.dumps(result, indent=2)}")
            
            if result.get("success"):
                message_data = result["response"]
                logger.info(f"Vulnerability: {message_data['vulnerability']}")
                logger.info(f"Found {len(message_data['messages'])} messages")
                
                for i, msg in enumerate(message_data['messages']):
                    logger.info(f"\nMessage {i+1}:")
                    logger.info(f"Content: {msg['content']}")
                    logger.info(f"Timestamp: {msg['timestamp']}")
                    logger.info(f"Techniques: {', '.join(msg['techniques']) if msg['techniques'] else 'None'}")
                    logger.info(f"Vulnerabilities: {', '.join(msg['vulnerabilities']) if msg['vulnerabilities'] else 'None'}")
                
                return True
            else:
                logger.error(f"API error: {result.get('message')}")
                return False
        else:
            logger.error(f"Failed to get all messages by vulnerability: {response.text}")
            return False

async def run_all_tests():
    """Run all statistics API tests"""
    logger.info("Starting statistics API tests...")
    
    # Test all statistics
    if not await test_all_statistics():
        logger.error("All statistics test failed")
    
    # Test single statistics
    if not await test_single_statistics():
        logger.error("Single statistics test failed")
    
    # Test messages by technique
    if not await test_messages_by_technique():
        logger.error("Messages by technique test failed")
    
    # Test messages by vulnerability
    if not await test_messages_by_vulnerability():
        logger.error("Messages by vulnerability test failed")
    
    # Test all messages by technique
    if not await test_all_messages_by_technique():
        logger.error("All messages by technique test failed")
    
    # Test all messages by vulnerability
    if not await test_all_messages_by_vulnerability():
        logger.error("All messages by vulnerability test failed")
    
    logger.info("Statistics tests completed")

if __name__ == "__main__":
    asyncio.run(run_all_tests())