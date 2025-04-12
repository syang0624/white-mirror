from fastapi import WebSocket
from typing import Dict
from uuid import UUID
from loguru import logger

# Simple connection manager for WebSockets
class ConnectionManager:
    def __init__(self):
        # Map of user_id (as string) to their WebSocket connection
        self.active_connections: Dict[str, WebSocket] = {}
        
    async def connect(self, websocket: WebSocket, user_id: str):
        """Connect a user's websocket"""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"User {user_id} connected")
        
    def disconnect(self, user_id: str):
        """Disconnect a user's websocket"""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            logger.info(f"User {user_id} disconnected")
    
    async def send_message(self, message: dict, user_id: str):
        """Send a message to a specific user"""
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)
            logger.info(f"Message sent to user {user_id}")
            return True
        logger.info(f"Cannot send message to user {user_id}: not connected")
        return False