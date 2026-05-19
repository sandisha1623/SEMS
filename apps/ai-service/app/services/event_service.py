from app.core.websocket import manager

class EventService:

    async def publish_detection(
        self,
        payload: dict
    ):

        await manager.broadcast({
            "type": "detection",
            "data": payload
        })