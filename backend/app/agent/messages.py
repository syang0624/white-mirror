from typing import List, Union, Optional, Any
from langchain_core.messages import (
    SystemMessage, 
    HumanMessage, 
    ToolMessage, 
    AIMessage, 
    AIMessageChunk, 
    BaseMessage
)

from .models import (
    LLMMessage,
    LLMTextPart,
    LLMToolCallPart,
    LLMToolResultPart
)

def convert_to_langchain_messages(messages: List[LLMMessage]) -> List[BaseMessage]:
    """Convert frontend message format to LangChain message format."""
    result = []
    
    for msg in messages:
        if msg.role == "system":
            result.append(SystemMessage(content=msg.content))

        elif msg.role == "user":
            # Extract text parts from user message
            content = []
            for part in msg.content:
                if isinstance(part, LLMTextPart):
                    content.append({"type": "text", "text": part.text})
            
            # Handle both string content and list of content parts
            if len(content) == 1:
                result.append(HumanMessage(content=content[0]["text"]))
            else:
                result.append(HumanMessage(content=content))

        elif msg.role == "assistant":
            # Extract text parts
            text_parts = [p for p in msg.content if isinstance(p, LLMTextPart)]
            text_content = " ".join(p.text for p in text_parts)
            
            # Extract tool calls
            tool_calls = []
            for p in msg.content:
                if isinstance(p, LLMToolCallPart):
                    tool_calls.append({
                        "id": p.toolCallId,
                        "name": p.toolName,
                        "args": p.args
                    })
            
            # Create AIMessage with text content and tool calls
            result.append(AIMessage(content=text_content, tool_calls=tool_calls))

        elif msg.role == "tool":
            # Process tool results
            for tool_result in msg.content:
                if isinstance(tool_result, LLMToolResultPart):
                    result.append(ToolMessage(
                        content=str(tool_result.result),
                        tool_call_id=tool_result.toolCallId,
                    ))

    return result

def convert_from_langchain_messages(messages: List[BaseMessage]) -> List[LLMMessage]:
    """Convert LangChain message format to frontend message format."""
    # This is a placeholder - implementation for frontend needs
    # Would be the reverse of convert_to_langchain_messages
    pass