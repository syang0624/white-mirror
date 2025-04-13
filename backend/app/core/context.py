from dataclasses import dataclass
import asyncio
import aiohttp
from typing import AsyncGenerator, TypedDict, cast, Optional
from loguru import logger
from fastapi import FastAPI, Request, WebSocket
import httpx
from httpx_aiohttp import AiohttpTransport
from contextlib import asynccontextmanager
from langgraph.graph.graph import CompiledGraph
from langchain_openai import ChatOpenAI
from langchain_perplexity import ChatPerplexity

from app.core.env import Env
from app.db.postgres import ConnParams, Postgres
from app.core.websocket import ConnectionManager
from app.service.classification.classifier import ManipulativeMessageClassifier
from app.agent.graph_builder import build_agent_graph
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "service" / "classification" / "manipulative_classifier.pkl"

@dataclass
class Context:
    http_client: httpx.AsyncClient
    db_workspace: Postgres
    ws_manager: ConnectionManager
    classifier: ManipulativeMessageClassifier
    agent_graph: CompiledGraph
    llm: ChatOpenAI
    perplexity: ChatPerplexity

class State(TypedDict):
    context: Context

# Global variable to store context
global_context: Optional[Context] = None

def get_ctx_from_request(request: Request):
    return cast(Context, request.state.context)

# Add function to get LLM
def get_llm(request: Request):
    ctx = get_ctx_from_request(request)
    return ctx.llm

def get_perplexity(request: Request):
    ctx = get_ctx_from_request(request)
    return ctx.perplexity

def get_postgres_client(request: Request):
    ctx = get_ctx_from_request(request)
    return ctx.db_workspace

def get_http_client(request: Request):
    ctx = get_ctx_from_request(request)
    return ctx.http_client

def get_ws_manager(request: Request):
    ctx = get_ctx_from_request(request)
    return ctx.ws_manager

def get_classifier(request: Request):
    ctx = get_ctx_from_request(request)
    return ctx.classifier

def get_agent_graph(request: Request):
    ctx = get_ctx_from_request(request)
    return ctx.agent_graph

# Functions to access global context
def get_global_context() -> Optional[Context]:
    return global_context

def get_global_postgres_client():
    if global_context:
        return global_context.db_workspace
    return None

def get_global_ws_manager():
    if global_context:
        return global_context.ws_manager
    return None

def get_global_llm():
    if global_context:
        return global_context.llm
    return None

def get_global_perplexity():
    if global_context:
        return global_context.perplexity
    return None

@asynccontextmanager
async def lifespan(
    app: FastAPI | None,
) -> AsyncGenerator[State, None]:
    """Lifespan handler for code to run before application startup"""
    global global_context
    
    logger.info("Setting application context...")

    # Database parameters
    db_host = Env.raw_get("POSTGRES_HOST", raise_if_none=True)
    db_port = Env.raw_get("POSTGRES_PORT", raise_if_none=True)
    db_user = Env.raw_get("POSTGRES_USER", raise_if_none=True)
    db_pass = Env.raw_get("POSTGRES_PASS", raise_if_none=True)
    db_name = Env.raw_get("POSTGRES_DB", raise_if_none=True)
    
    # OpenAI API key
    openai_api_key = Env.raw_get("OPENAI_API_KEY", raise_if_none=True)

    # Perplexity API key
    pplx_api_key = Env.raw_get("PPLX_API_KEY", raise_if_none=True)
    print(pplx_api_key)
    
    db_params = ConnParams(
        db_user=db_user,
        db_pass=db_pass,
        db_host=db_host,
        db_name=db_name,
        db_port=int(db_port),
    )

    ws_manager = ConnectionManager()

    classifier = ManipulativeMessageClassifier()
    classifier.load_model(str(MODEL_PATH))
    
    # Initialize the ChatOpenAI model with the API key
    llm = ChatOpenAI(
        temperature=0.7,
        model_name="gpt-4o-mini",
        api_key=openai_api_key
    )
    
    # Initialize Perplexity
    perplexity = ChatPerplexity(
        pplx_api_key=pplx_api_key,
        model="sonar",
        temperature=0.7
    )
    
    # Build and compile the agent graph
    logger.info("Building and compiling agent graph...")
    agent_graph = build_agent_graph().compile()

    async with Postgres.init(**db_params) as db_workspace:
        aiohttp_session = aiohttp.ClientSession(
            auto_decompress=True,
            loop=asyncio.get_running_loop(),
            connector=aiohttp.TCPConnector(
                limit=1000,
                use_dns_cache=True
            ),
            timeout=aiohttp.ClientTimeout(
                total=180.0,
                connect=10.0
            )
        )
        
        async with AiohttpTransport(client=aiohttp_session) as aiohttp_transport:
            http_client = httpx.AsyncClient(
                transport=aiohttp_transport,
                timeout=httpx.Timeout(timeout=180.0, connect=10.0),
                limits=httpx.Limits(
                    max_connections=1000,
                    max_keepalive_connections=1000
                )
            )

            ctx = Context(
                http_client=http_client,
                db_workspace=db_workspace,
                ws_manager=ws_manager,
                classifier=classifier,
                agent_graph=agent_graph,
                llm=llm,
                perplexity=perplexity
            )
            
            # Set global context
            global_context = ctx

            yield {"context": ctx}