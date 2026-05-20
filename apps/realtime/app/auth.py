import jwt
import hashlib

from app.config import JWT_SECRET, JWT_ALGORITHM
from app.redis_client import redis_client


def verify_token(token: str):
    """
    Verifikasi JWT dari CI4 (JwtService - format FLAT) dan cek blacklist.

    Return dict payload {uid, username, email, role, iat, exp} bila valid,
    None bila gagal.
    """
    try:
        token = (token or "").strip()
        if not token:
            return None

        # 1) Cek blacklist (key sama dengan TokenBlacklist.php: jwt_blacklist_<md5>)
        token_hash    = hashlib.md5(token.encode()).hexdigest()
        blacklist_key = "jwt_blacklist_" + token_hash

        if redis_client.exists(blacklist_key):
            print("[auth] token blacklisted")
            return None

        # 2) Decode — secret HARUS sama dengan CI4 .env (jwt.secret)
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )

        # FLAT format: {uid, username, email, role, iat, exp}
        if "uid" not in payload:
            print("[auth] missing uid in payload")
            return None

        return payload

    except jwt.ExpiredSignatureError:
        print("[auth] token expired")
        return None
    except Exception as e:
        print("[auth] error:", e)
        return None