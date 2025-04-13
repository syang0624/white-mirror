from uuid import UUID
from app.agent.graph_builder import build_agent_graph, should_continue
from app.agent.tools import create_tools_with_user_id
from app.agent.state import AgentState
from langgraph.graph import StateGraph, END

# Use a test user ID for visualization purposes
TEST_USER_ID = UUID("0e2d25d3-ccee-4b84-9f97-172636348d5f")  
test_tools = create_tools_with_user_id(TEST_USER_ID)

# Create patched versions of the functions that will work in LangGraph Studio
async def patched_call_model(state, config):
    # Ensure tools are available in the config
    config_copy = config.copy() if config else {}
    config_copy["tools"] = test_tools
    
    # Import the original function here to avoid circular imports
    from app.agent.graph_builder import call_model
    return await call_model(state, config_copy)

async def patched_run_tools(state, config, **kwargs):
    # Ensure tools are available in the config
    config_copy = config.copy() if config else {}
    config_copy["tools"] = test_tools
    
    # Import the original function here to avoid circular imports
    from app.agent.graph_builder import run_tools
    return await run_tools(state, config_copy, **kwargs)

# Build a new graph with our patched functions
def build_patched_graph():
    # Initialize a new state graph
    workflow = StateGraph(AgentState)
    
    # Add nodes with our patched functions
    workflow.add_node("agent", patched_call_model)
    workflow.add_node("tools", patched_run_tools)
    
    # Set entry point
    workflow.set_entry_point("agent")
    
    # Add edges
    workflow.add_conditional_edges("agent", should_continue, {
        "tools": "tools",
        END: END
    })
    workflow.add_edge("tools", "agent")
    
    return workflow

# Build and compile the graph
agent_graph = build_patched_graph()
compiled_graph = agent_graph.compile()