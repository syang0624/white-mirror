from fastapi import APIRouter, Request, HTTPException, status
from fastapi.responses import JSONResponse
from uuid import UUID
from typing import List, Dict, Any, Optional
from loguru import logger

from app.dto.agent import (
    ChatRequest,
    ChatResponse,
    ChatMessage,
    ChatToolCall,
    ChatResponseData,
    SimpleChatRequest,
    SimpleChatResponse,
    SimpleChatToolCall
)
from app.agent.tools import create_tools_with_user_id
from app.agent.runner import run_graph_with_controller, AccumulatorController
from app.agent.messages import convert_to_langchain_messages
from app.core.context import get_agent_graph
from assistant_stream import create_run, RunController
from assistant_stream.serialization import DataStreamResponse
from app.agent.prompt_builder import build_system_prompt
from langchain_core.messages import SystemMessage, HumanMessage

router = APIRouter()

@router.post("/simple-chat", response_model=SimpleChatResponse)
async def simple_chat(request_data: SimpleChatRequest, request: Request):
    """
    Simple chat endpoint that takes just user_id and message.
    """
    try:
        # Get the agent graph from context
        agent_graph = get_agent_graph(request)
        
        # Validate user_id
        try:
            user_uuid = UUID(request_data.user_id)
        except ValueError:
            return SimpleChatResponse(
                success=False,
                message="Invalid user ID format"
            )
        
        # Create tools with user_id injected
        tools = create_tools_with_user_id(user_uuid)
        
        # Build system prompt using your existing prompt builder
        system_prompt = build_system_prompt("", tools)
        
        # Convert to LangChain format
        langchain_messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=request_data.message)
        ]
        
        # Create config for the agent
        config = {
            "tools": tools,
            "user_id": str(user_uuid)
        }
        
        # Set up controller
        controller = AccumulatorController()
        
        # Run the agent
        await run_graph_with_controller(
            graph=agent_graph, 
            messages=langchain_messages, 
            config=config, 
            controller=controller
        )
        
        # Get result from controller
        result = controller.get_final_result()
        
        # Create tool calls for response
        tool_calls = [
            SimpleChatToolCall(
                id=tc["id"],
                name=tc["name"],
                args=tc.get("args", ""),
                result=tc.get("result")
            )
            for tc in result.get("tool_calls", [])
        ]
        
        # Return response
        return SimpleChatResponse(
            message="Chat response generated successfully",
            text=result.get("text", ""),
            tool_calls=tool_calls
        )
        
    except Exception as e:
        logger.error(f"Error in simple chat endpoint: {str(e)}")
        return SimpleChatResponse(
            success=False,
            message=f"Error generating response: {str(e)}"
        )

@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest, request: Request):
    """
    Chat with the AI agent to analyze manipulative patterns in messages.
    """
    try:
        # Get the agent graph from context
        agent_graph = get_agent_graph(request)
        
        # Validate user_id
        try:
            user_id = UUID(body.user_id)
        except ValueError:
            return ChatResponse(
                success=False,
                message="Invalid user ID format",
                response=None
            )
        
        # Create tools with user_id injected
        tools = create_tools_with_user_id(user_id)
        
        # Convert messages to LangChain format
        langchain_messages = convert_to_langchain_messages(body.messages)
        
        # Create config for the agent
        config = {
            "system": body.system,
            "tools": tools,
            "user_id": str(user_id)
        }
        
        controller = AccumulatorController()
        
        # Run the agent
        await run_graph_with_controller(
            graph=agent_graph, 
            messages=langchain_messages, 
            config=config, 
            controller=controller
        )
        
        # Get result from controller
        result = controller.get_final_result()
        
        # Create the response
        return ChatResponse(
            message="Chat response generated successfully",
            response=ChatResponseData(
                text=result.get("text", ""),
                tool_calls=[
                    ChatToolCall(
                        id=tc["id"],
                        name=tc["name"],
                        args=tc.get("args", ""),
                        result=tc.get("result")
                    )
                    for tc in result.get("tool_calls", [])
                ]
            )
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        return ChatResponse(
            success=False,
            message=f"Error generating response: {str(e)}",
            response=None
        )

@router.post("/chat-stream")
async def chat_stream(body: ChatRequest, request: Request):
    """
    Chat with the AI agent with streaming response.
    """
    try:
        # Get the agent graph from context
        agent_graph = get_agent_graph(request)
        
        # Validate user_id
        try:
            user_id = UUID(body.user_id)
        except ValueError:
            return JSONResponse(
                content={"error": "Invalid user ID format"},
                status_code=400
            )
        
        # Create tools with user_id injected
        tools = create_tools_with_user_id(user_id)
        
        # Convert messages to LangChain format
        langchain_messages = convert_to_langchain_messages(body.messages)
        
        # Create config for the agent
        config = {
            "system": body.system,
            "tools": tools,
            "user_id": str(user_id)
        }
        
        # Use RunController with assistant_stream
        async def run(controller: RunController):
            await run_graph_with_controller(agent_graph, langchain_messages, config, controller)
            
        return DataStreamResponse(create_run(run))
        
    except Exception as e:
        logger.error(f"Error in chat-stream endpoint: {str(e)}")
        return JSONResponse(
            content={"error": f"Error generating response: {str(e)}"},
            status_code=500
        )