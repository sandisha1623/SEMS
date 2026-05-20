import asyncio
import json

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from app.config import REDIS_CHANNEL
from app.auth import verify_token
from app.connection_manager import manager
from app.redis_client import redis_client


app = FastAPI(title="SEMS Realtime")


# ─────────────────────────────────────────────
# WEBSOCKET ENDPOINT
# ─────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    token   = websocket.query_params.get("token")
    payload = verify_token(token)

    if not payload:
        # 1008 = policy violation (RFC 6455). Klien tahu auth gagal.
        await websocket.close(code=1008)
        return

    user_id  = str(payload["uid"])
    username = payload.get("username", "")
    role     = payload.get("role", "")

    await manager.connect(user_id, websocket)
    print(f"[ws] connected user={user_id} ({username}, {role})")

    try:
        while True:
            data = await websocket.receive_text()

            if data == "ping":
                manager.heartbeat(user_id)
                await websocket.send_text("pong")
                continue

            # echo untuk debug; client biasanya hanya menerima push
            await websocket.send_json({
                "type": "echo",
                "data": data,
            })

    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
        print(f"[ws] disconnected user={user_id}")


# ─────────────────────────────────────────────
# REDIS SUBSCRIBER — bridge dari CI4 publish ke WS
# ─────────────────────────────────────────────
async def redis_subscriber():
    pubsub = redis_client.pubsub()
    pubsub.subscribe(REDIS_CHANNEL)
    print(f"[redis] subscribed: {REDIS_CHANNEL}")

    while True:
        message = pubsub.get_message(ignore_subscribe_messages=True)

        if message and message.get("type") == "message":
            try:
                data         = json.loads(message["data"])
                target_user  = data.get("user_id")

                if target_user:
                    await manager.send_to_user(str(target_user), data)
                else:
                    await manager.broadcast(data)

            except Exception as e:
                print("[redis] event error:", e)

        await asyncio.sleep(0.1)


# ─────────────────────────────────────────────
# STARTUP / HEALTH
# ─────────────────────────────────────────────
@app.on_event("startup")
async def on_startup():
    asyncio.create_task(redis_subscriber())


@app.get("/")
def health():
    return {"status": "ok", "service": "sems-realtime"}