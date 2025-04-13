from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.tools import BaseTool
from typing import List, Dict, Any, Optional

from .state import AgentState
from .prompt_builder import build_system_prompt

def should_continue(state: AgentState) -> str:
    """Determine if we should continue running tools or end the graph."""
    messages = state["messages"]
    last_message = messages[-1]
    
    # If the last message has tool calls, continue to "tools" node
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    
    # Otherwise end the graph
    return END

async def call_model(state: AgentState, config: Dict[str, Any]) -> Dict[str, Any]:
    """Call the LLM to generate a response."""
    # Get tools from config - look in multiple places to be robust
    tools = config.get("tools", [])
    
    # If tools not found directly, check if they're in configurable
    if not tools and "configurable" in config and "tools" in config["configurable"]:
        tools = config["configurable"]["tools"]
        
    # Get system prompt - also be robust about where it comes from
    system_text = ""
    if "configurable" in config and "system" in config["configurable"]:
        system_text = config["configurable"]["system"]
    elif "system" in config:
        system_text = config["system"]
    
    # Build system prompt
    system_prompt_text = build_system_prompt(system_text, tools)
    
    # Prepare messages - inject system prompt at the beginning
    system_message = SystemMessage(content=system_prompt_text)
    messages = [system_message] + state["messages"]
    
    # Create model with tools bound
    model = ChatOpenAI(temperature=0.7, model_name="gpt-4o-mini")
    model_with_tools = model.bind_tools(tools)
    
    # Generate a response
    response = await model_with_tools.ainvoke(messages)
    
    return {"messages": [response], "context": state.get("context", {})}

async def run_tools(state: AgentState, config: Dict[str, Any], **kwargs) -> Dict[str, Any]:
    """Execute tools called by the LLM."""
    # Get tools from config - look in multiple places to be robust
    tools = config.get("tools", None)
    
    # If tools not found directly, check if they're in configurable
    if tools is None and "configurable" in config and "tools" in config["configurable"]:
        tools = config["configurable"]["tools"]
    
    # If still None, check kwargs
    if tools is None and "tools" in kwargs:
        tools = kwargs["tools"]
        
    # If still no tools found, raise a more helpful error
    if tools is None:
        raise ValueError("No tools found in config. Make sure tools are provided in config['tools'] or config['configurable']['tools']")
    
    # Use ToolNode to handle tool execution
    tool_node = ToolNode(tools)
    result = await tool_node.ainvoke(state, config, **kwargs)
    
    return result

def build_agent_graph(tools: Optional[List[BaseTool]] = None) -> StateGraph:
    """Build the agent graph with the given tools."""
    # Initialize the state graph
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("agent", call_model)
    workflow.add_node("tools", run_tools)
    
    # Set entry point
    workflow.set_entry_point("agent")
    
    # Add edges
    workflow.add_conditional_edges("agent", should_continue, {
        "tools": "tools",
        END: END
    })
    workflow.add_edge("tools", "agent")
    
    return workflow