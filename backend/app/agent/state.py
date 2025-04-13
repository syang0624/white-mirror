from typing import Annotated, List, Dict, Any
from typing_extensions import TypedDict
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    """State maintained by the agent across steps in the graph."""
    messages: Annotated[List[BaseMessage], add_messages]
    # Optional additional state elements could be added here
    context: Dict[str, Any]