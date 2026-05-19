from fastapi import APIRouter
from fastapi import WebSocket
from fastapi import WebSocketDisconnect

from app.core.websocket import manager
from app.core.security import verify_token

router = APIRouter()

@router.websocket("/ws")

async def websocket_endpoint(
    websocket: WebSocket
):

    token = websocket.query_params.get("token")

    if not token:

        await websocket.close(code=1008)

        return

    try:

        payload = verify_token(token)

        print("AUTH USER:", payload)

        await manager.connect(websocket)

        while True:

            data = await websocket.receive_text()

            await manager.broadcast({
                "message": data,
                "username": payload["username"],
                "role": payload["role"]
            })

    except WebSocketDisconnect:

        manager.disconnect(websocket)

    except Exception as e:

        print("WS ERROR:", e)

        await websocket.close(code=1008)