import asyncio
import json
import jwt

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from app.connection_manager import manager
from app.redis_client import redis_client

app = FastAPI()

SECRET_KEY = "91b776cad183181cc111f53b37f27b19d33a76aa059fe4684751b30de023b5ae"
ALGORITHM = "HS256"


# ─────────────────────────────
# WEBSOCKET ENDPOINT
# ─────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket
):

    token = websocket.query_params.get("token")

    print("TOKEN:", token)

    user_id = decode_token_get_user_id(token)

    print("USER ID:", user_id)

    # VALIDASI
    if not user_id:

        print("INVALID TOKEN")

        await websocket.close()

        return

    await manager.connect(
        str(user_id), 
        websocket
    )

    try:

        while True:

            data = await websocket.receive_text()

            print("WS MESSAGE:", data)

            if data == "ping":

                manager.heartbeat(
                    str(user_id)
                )

                await websocket.send_text("pong")

            else:

                await websocket.send_text(
                    f"Echo: {data}"
                )

    except WebSocketDisconnect:

        manager.disconnect(user_id, websocket)

        print(
            "DISCONNECTED:",
            user_id
        )


# ─────────────────────────────
# REDIS SUBSCRIBER (EVENT BUS)
# ─────────────────────────────
async def redis_subscriber():

    pubsub = redis_client.pubsub()
    pubsub.subscribe("sems_events")

    print("Subscribed: sems_events")

    while True:

        message = pubsub.get_message(
            ignore_subscribe_messages=True
        )

        if message:

            try:

                data = json.loads(message["data"])

                user_id = data.get("user_id")

                await manager.send_to_user(
                    user_id,
                    data
                )

            except Exception as e:

                print("Redis event error:", e)

        await asyncio.sleep(0.1)


# ─────────────────────────────
# STARTUP
# ─────────────────────────────
@app.on_event("startup")
async def startup():

    asyncio.create_task(redis_subscriber())


# ─────────────────────────────
# HEALTH CHECK
# ─────────────────────────────
@app.get("/")
def health():

    return {
        "status": "ok",
        "realtime": "active"
    }

def decode_token_get_user_id(token):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        print("PAYLOAD:", payload)

        return str(
            payload["uid"]
        )

    except Exception as e:

        print("JWT ERROR:", e)

        return None