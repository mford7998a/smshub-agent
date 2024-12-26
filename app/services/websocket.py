import asyncio
import json
import logging
from typing import Dict, Set, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect
from ..core.config import settings

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Active connections by user ID
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # Message queue for each user
        self.message_queues: Dict[int, asyncio.Queue] = {}
        
    async def connect(self, websocket: WebSocket, user_id: int):
        """Connect a new WebSocket client."""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
            self.message_queues[user_id] = asyncio.Queue(
                maxsize=settings.WS_MESSAGE_QUEUE_SIZE
            )
            
        self.active_connections[user_id].add(websocket)
        logger.info(f"New WebSocket connection for user {user_id}")
        
    async def disconnect(self, websocket: WebSocket, user_id: int):
        """Disconnect a WebSocket client."""
        self.active_connections[user_id].remove(websocket)
        
        if not self.active_connections[user_id]:
            del self.active_connections[user_id]
            del self.message_queues[user_id]
            
        logger.info(f"WebSocket disconnected for user {user_id}")
        
    async def send_personal_message(self, message: Dict[str, Any], user_id: int):
        """Send a message to a specific user."""
        if user_id not in self.active_connections:
            return
            
        try:
            await self.message_queues[user_id].put(message)
        except asyncio.QueueFull:
            logger.warning(f"Message queue full for user {user_id}")
            # Remove oldest message and try again
            try:
                self.message_queues[user_id].get_nowait()
                await self.message_queues[user_id].put(message)
            except:
                pass
                
    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast a message to all connected clients."""
        for user_id in self.active_connections:
            await self.send_personal_message(message, user_id)
            
    async def handle_client(self, websocket: WebSocket, user_id: int):
        """Handle WebSocket client connection."""
        try:
            await self.connect(websocket, user_id)
            
            # Start message consumer task
            consumer_task = asyncio.create_task(
                self._consume_messages(websocket, user_id)
            )
            
            try:
                while True:
                    # Handle incoming messages from client
                    data = await websocket.receive_text()
                    try:
                        message = json.loads(data)
                        await self._handle_client_message(message, user_id)
                    except json.JSONDecodeError:
                        logger.warning(f"Invalid JSON from user {user_id}")
                        
            except WebSocketDisconnect:
                consumer_task.cancel()
                await self.disconnect(websocket, user_id)
                
        except Exception as e:
            logger.error(f"WebSocket error for user {user_id}: {str(e)}")
            try:
                await self.disconnect(websocket, user_id)
            except:
                pass
                
    async def _consume_messages(self, websocket: WebSocket, user_id: int):
        """Consume messages from the user's queue and send them."""
        try:
            while True:
                message = await self.message_queues[user_id].get()
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Failed to send message to user {user_id}: {str(e)}")
                    # Put message back in queue
                    try:
                        await self.message_queues[user_id].put(message)
                    except:
                        pass
                    break
                    
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Message consumer error for user {user_id}: {str(e)}")
            
    async def _handle_client_message(self, message: Dict[str, Any], user_id: int):
        """Handle messages received from clients."""
        message_type = message.get("type")
        
        if message_type == "ping":
            await self.send_personal_message({"type": "pong"}, user_id)
        else:
            logger.warning(f"Unknown message type from user {user_id}: {message_type}")
            
    def get_active_connections_count(self) -> int:
        """Get total number of active connections."""
        return sum(len(connections) for connections in self.active_connections.values())
        
    def get_user_connections_count(self, user_id: int) -> int:
        """Get number of active connections for a user."""
        return len(self.active_connections.get(user_id, set()))
        
    async def send_modem_update(self, modem_id: int, data: Dict[str, Any]):
        """Send modem status update to all connected clients."""
        message = {
            "type": "modem_update",
            "modem_id": modem_id,
            "data": data
        }
        await self.broadcast(message)
        
    async def send_activation_update(self, activation_id: str, data: Dict[str, Any]):
        """Send activation status update to all connected clients."""
        message = {
            "type": "activation_update",
            "activation_id": activation_id,
            "data": data
        }
        await self.broadcast(message)
        
    async def send_sms_update(self, sms_id: str, data: Dict[str, Any]):
        """Send SMS status update to all connected clients."""
        message = {
            "type": "sms_update",
            "sms_id": sms_id,
            "data": data
        }
        await self.broadcast(message)
        
    async def send_error(self, user_id: int, error: str, details: Optional[Dict] = None):
        """Send error message to a specific user."""
        message = {
            "type": "error",
            "error": error,
            "details": details
        }
        await self.send_personal_message(message, user_id)

# Global WebSocket connection manager
manager = ConnectionManager() 