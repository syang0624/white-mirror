import aiohttp
import asyncio
import json
import sys
from typing import List, Dict, Any, Optional

# Base URL for your API
BASE_URL = "http://localhost:8000"

# Test user ID - the one with manipulative messages in the database
TEST_USER_ID = "0e2d25d3-ccee-4b84-9f97-172636348d5f"

async def test_natural_language_queries():
    """Test the /agent/simple-chat endpoint with natural language queries about manipulation."""
    
    # Natural language queries that don't specify exact techniques but describe behaviors
    queries = [
        "Has anyone been making me feel guilty recently?",
        "Is someone trying to control me in our conversations?",
        "Do any of my contacts try to make me doubt myself?",
        "Is someone being passive-aggressive with me?",
        "Has anyone been pressuring me to do things I don't want to?",
        "Is someone playing mind games with me?",
        "Do any of my contacts criticize me unfairly?",
        "Is someone using emotional blackmail against me?"
    ]
    
    for i, query in enumerate(queries, 1):
        print(f"\n\n===== Test {i}: '{query}' =====\n")
        
        # Prepare request data
        request_data = {
            "user_id": TEST_USER_ID,
            "message": query
        }
        
        # Make the request
        async with aiohttp.ClientSession() as session:
            try:
                print(f"Sending request: {json.dumps(request_data, indent=2)}")
                
                async with session.post(
                    f"{BASE_URL}/agent/simple-chat",
                    headers={"Content-Type": "application/json"},
                    json=request_data
                ) as response:
                    status = response.status
                    print(f"Status code: {status}")
                    
                    if status == 200:
                        result = await response.json()
                        print("Response:")
                        print(json.dumps(result, indent=2))
                        
                        # Check for tool calls
                        tool_calls = result.get("tool_calls", [])
                        if tool_calls:
                            print(f"\n✅ Tool calls made: {len(tool_calls)}")
                            first_tool = tool_calls[0]["name"] if tool_calls else "None"
                            print(f"First tool used: {first_tool}")
                            
                            # Check which techniques/vulnerabilities were detected
                            try:
                                result_data = json.loads(tool_calls[0]["result"])
                                if "users" in result_data and result_data["users"]:
                                    user = result_data["users"][0]
                                    techniques = [t["name"] for t in user.get("techniques", [])]
                                    vulnerabilities = [v["name"] for v in user.get("vulnerabilities", [])]
                                    
                                    print("\nTechniques detected:")
                                    for tech in techniques:
                                        print(f"  - {tech}")
                                        
                                    print("\nVulnerabilities targeted:")
                                    for vuln in vulnerabilities:
                                        print(f"  - {vuln}")
                            except (json.JSONDecodeError, KeyError, TypeError, IndexError) as e:
                                print(f"Could not parse tool result: {e}")
                        else:
                            print("\n❌ No tool calls made!")
                            
                        # Print main response text (truncated for readability)
                        text = result.get("text", "No response text")
                        preview = text[:300] + "..." if len(text) > 300 else text
                        print("\nResponse text preview:")
                        print(preview)
                    else:
                        error_text = await response.text()
                        print(f"Error: {error_text}")
                        
            except Exception as e:
                print(f"Exception: {str(e)}")
                
        # Wait briefly between requests
        await asyncio.sleep(1)

if __name__ == "__main__":
    print("\n========== TESTING NATURAL LANGUAGE AGENT QUERIES ==========\n")
    asyncio.run(test_natural_language_queries())