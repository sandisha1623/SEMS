import json
import asyncio

from app.redis_client import redis_client
from app.connection_manager import manager


async def redis_subscriber():

    pubsub = redis_client.pubsub()

    pubsub.subscribe("sems_events")

    print("Subscribed: sems_events")

    while True:

        message = pubsub.get_message()

        if message and message["type"] == "message":

            try:

                data = json.loads(
                    message["data"]
                )

                print("EVENT:", data)

                target_user = data.get("user_id")

                if target_user:

                    await manager.send_to_user(
                        str(target_user),
                        data
                    )

                else:

                    await manager.broadcast(
                        data
                    )

            except Exception as e:

                print("PUBSUB ERROR:", e)

        await asyncio.sleep(0.1)