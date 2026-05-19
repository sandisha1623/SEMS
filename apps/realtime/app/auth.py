import jwt
import hashlib

from app.config import JWT_SECRET
from app.redis_client import redis_client


def verify_token(token: str):

    try:

        token = token.strip()
        
        token_hash = hashlib.md5(
            token.encode()
        ).hexdigest()

        blacklist_key = (
            "jwt_blacklist_" + token_hash
        )

        print("TOKEN:", token)
        print("HASH:", token_hash)
        print("BLACKLIST:", blacklist_key)

        exists = redis_client.exists(
            blacklist_key
        )

        print("EXISTS:", exists)

        if exists:
            return None

        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=["HS256"]
        )

        return payload["data"]

    except Exception as e:

        print("AUTH ERROR:", e)

        return None