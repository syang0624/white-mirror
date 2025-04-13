import aiohttp
import asyncio
import json
import sys
from typing import List, Dict, Any, Optional

# Base URL for your API
BASE_URL = "http://localhost:8000"

# Test user ID - the one with manipulative messages in the database
TEST_USER_ID = "0e2d25d3-ccee-4b84-9f97-172636348d5f"

async def test_web_search_queries():
    """Test the /agent/simple-chat endpoint with queries that should use web search."""
    
    # General educational queries about manipulation that should use web search
    queries = [
        "What are the most common manipulation techniques used in relationships?",
        "How can I identify if someone is gaslighting me?",
        "What resources are available for people dealing with manipulative relationships?",
        "What's the difference between healthy persuasion and manipulation?",
        "How do manipulators typically respond when confronted?",
        "What are some effective ways to respond to guilt-tripping?",
        "Are there cultural differences in how manipulation is perceived?",
        "What psychological theories explain manipulative behavior?",
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
                            
                            # Check if web_search was used
                            web_search_calls = [tc for tc in tool_calls if tc["name"] == "web_search"]
                            if web_search_calls:
                                print(f"✅ web_search was used ({len(web_search_calls)} times)")
                                
                                # Print the query and result
                                for call in web_search_calls:
                                    query_args = call.get("args", "{}")
                                    try:
                                        query_obj = json.loads(query_args)
                                        query_text = query_obj.get("query", "Unknown")
                                    except json.JSONDecodeError:
                                        query_text = query_args
                                        
                                    print(f"\nWeb search query: {query_text}")
                                    print(f"Result preview: {call.get('result', 'No result')[:150]}...")
                            else:
                                print("❌ web_search was NOT used")
                                
                                # Show which tools were used instead
                                used_tools = [tc["name"] for tc in tool_calls]
                                print(f"Tools used instead: {', '.join(used_tools)}")
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
                
        # Wait briefly between requests to avoid rate limiting
        await asyncio.sleep(2)

async def compare_personal_vs_general():
    """Compare how the agent handles personal questions vs general educational questions."""
    
    # Pairs of questions - personal vs general version of similar topics
    query_pairs = [
        # Format: [personal question, general question]
        [
            "Has anyone been manipulating me in our conversations?", 
            "What are common signs of manipulation in conversations?"
        ],
        [
            "Is someone making me feel guilty in my messages?",
            "How do people typically use guilt as a manipulation tactic?"
        ],
        [
            "How should I respond to Test User who keeps pressuring me?",
            "How should someone respond to pressure tactics in relationships?"
        ]
    ]
    
    for i, (personal, general) in enumerate(query_pairs, 1):
        print(f"\n\n===== Comparison Test {i} =====\n")
        
        # Test personal question
        print(f"--- Personal Question: '{personal}' ---\n")
        personal_data = {"user_id": TEST_USER_ID, "message": personal}
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{BASE_URL}/agent/simple-chat",
                headers={"Content-Type": "application/json"},
                json=personal_data
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    tool_calls = result.get("tool_calls", [])
                    tools_used = [tc["name"] for tc in tool_calls]
                    
                    print(f"Tool calls: {len(tool_calls)}")
                    print(f"Tools used: {', '.join(tools_used)}")
                    print(f"Used web_search: {'Yes' if 'web_search' in tools_used else 'No'}")
                    print(f"Used data analysis: {'Yes' if any(t != 'web_search' for t in tools_used) else 'No'}")
                
        # Wait briefly
        await asyncio.sleep(2)
        
        # Test general question
        print(f"\n--- General Question: '{general}' ---\n")
        general_data = {"user_id": TEST_USER_ID, "message": general}
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{BASE_URL}/agent/simple-chat",
                headers={"Content-Type": "application/json"},
                json=general_data
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    tool_calls = result.get("tool_calls", [])
                    tools_used = [tc["name"] for tc in tool_calls]
                    
                    print(f"Tool calls: {len(tool_calls)}")
                    print(f"Tools used: {', '.join(tools_used)}")
                    print(f"Used web_search: {'Yes' if 'web_search' in tools_used else 'No'}")
                    print(f"Used data analysis: {'Yes' if any(t != 'web_search' for t in tools_used) else 'No'}")
        
        # Wait briefly
        await asyncio.sleep(2)

async def main():
    """Main function to run tests"""
    print("\n========== TESTING WEB SEARCH FUNCTIONALITY ==========\n")
    
    # Choose which test to run
    if len(sys.argv) > 1 and sys.argv[1] == "compare":
        await compare_personal_vs_general()
    else:
        await test_web_search_queries()

if __name__ == "__main__":
    # Run the test
    asyncio.run(main())