from langchain_core.messages import ToolMessage, AIMessageChunk, AIMessage
from typing import Dict, Any

class AccumulatorController:
    """Controller that accumulates text and tool calls from the LLM."""
    
    def __init__(self):
        self.content = ""
        self.tool_calls = {}
    
    def append_text(self, text: str):
        """Append text to the content."""
        self.content += text
    
    async def add_tool_call(self, name: str, id: str):
        """Add a new tool call."""
        tool_controller = ToolCallController(name)
        self.tool_calls[id] = tool_controller
        return tool_controller

    def get_final_result(self):
        """Get the final result from the controller."""
        # Format tool calls into the expected structure
        tool_calls_list = []
        for tool_id, tool_controller in self.tool_calls.items():
            tool_calls_list.append({
                "id": tool_id,
                "name": tool_controller.name,
                "args": tool_controller.args_text,
                "result": tool_controller.result
            })
        
        return {
            "text": self.content,
            "tool_calls": tool_calls_list
        }

class ToolCallController:
    """Controller for a single tool call."""
    
    def __init__(self, name: str):
        self.name = name
        self.args_text = ""
        self.result = None
    
    def append_args_text(self, text: str):
        """Append text to tool arguments."""
        self.args_text += text
    
    def set_result(self, result: Any):
        """Set the result of the tool call."""
        self.result = result

async def run_graph_with_controller(graph, messages, config, controller):
    """Run the agent graph with a controller for streaming."""
    tool_calls = {}
    tool_calls_by_idx = {}

    # Stream messages from the graph
    async for msg, _ in graph.astream(
        {"messages": messages, "context": {}},
        {"configurable": config, "tools": config.get("tools", [])},
        stream_mode="messages",
    ):
        # Handle tool messages
        if isinstance(msg, ToolMessage):
            tool_controller = tool_calls.get(msg.tool_call_id)
            if tool_controller:
                tool_controller.set_result(msg.content)

        # Handle AI messages and chunks
        elif isinstance(msg, AIMessageChunk) or isinstance(msg, AIMessage):
            # Process content
            if msg.content:
                controller.append_text(msg.content)

            # Process tool calls
            if hasattr(msg, "tool_call_chunks") and msg.tool_call_chunks:
                for chunk in msg.tool_call_chunks:
                    chunk_idx = chunk.get("index")
                    chunk_id = chunk.get("id")
                    
                    # Create a new tool controller if needed
                    if chunk_idx not in tool_calls_by_idx:
                        tool_controller = await controller.add_tool_call(
                            chunk.get("name", "unknown"), 
                            chunk_id
                        )
                        tool_calls_by_idx[chunk_idx] = tool_controller
                        tool_calls[chunk_id] = tool_controller
                    else:
                        tool_controller = tool_calls_by_idx[chunk_idx]
                    
                    # Append arguments text
                    if "args" in chunk:
                        tool_controller.append_args_text(chunk["args"])