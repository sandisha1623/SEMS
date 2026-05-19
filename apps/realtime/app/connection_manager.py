import asyncio
import time

from fastapi import WebSocket
from app.redis_client import redis_client


class ConnectionManager:

    def __init__(self):
        self.connections = {}

    # ─────────────────────────────
    # CONNECT
    # ─────────────────────────────
    async def connect(self, user_id, websocket: WebSocket):

        await websocket.accept()

        user_id = str(user_id)

        if user_id not in self.connections:
            self.connections[user_id] = []

        self.connections[user_id].append(websocket)

        # 🔥 TTL PRESENCE
        redis_client.setex(
            f"presence:{user_id}",
            30,
            "online"
        )

        print("CONNECTED:", user_id)

    # ─────────────────────────────
    # DISCONNECT
    # ─────────────────────────────
    def disconnect(self, user_id, websocket):

        user_id = str(user_id)

        if user_id in self.connections:

            if websocket in self.connections[user_id]:
                self.connections[user_id].remove(websocket)

            if not self.connections[user_id]:
                self.connections.pop(user_id, None)

        # ❗ tidak hapus Redis (TTL handle otomatis)

        print("DISCONNECTED:", user_id)

    # ─────────────────────────────
    # HEARTBEAT
    # ─────────────────────────────
    def heartbeat(self, user_id):

        user_id = str(user_id)

        redis_client.setex(
            f"presence:{user_id}",
            30,
            "online"
        )

        print("HEARTBEAT:", user_id)

    # ─────────────────────────────
    # SEND TO USER
    # ─────────────────────────────
    async def send_to_user(self, user_id, message):

        user_id = str(user_id)

        if user_id not in self.connections:
            return

        disconnected = []

        for ws in self.connections[user_id]:

            try:
                await ws.send_json(message)

            except:
                disconnected.append(ws)

        for ws in disconnected:
            self.disconnect(user_id, ws)

    # ─────────────────────────────
    # BROADCAST
    # ─────────────────────────────
    async def broadcast(self, message):

        for user_id in list(self.connections.keys()):

            await self.send_to_user(user_id, message)


manager = ConnectionManager()