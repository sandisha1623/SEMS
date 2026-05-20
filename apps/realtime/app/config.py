import os
from dotenv import load_dotenv

load_dotenv()

# WAJIB: nilai ini harus SAMA dengan env('jwt.secret') di CI4 (.env)
JWT_SECRET = os.getenv(
    "JWT_SECRET",
    "91b776cad183181cc111f53b37f27b19d33a76aa059fe4684751b30de023b5ae",
)

JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

REDIS_HOST = os.getenv("REDIS_HOST", "127.0.0.1")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))

# Channel pub/sub yang dipakai CI4 NotificationService
REDIS_CHANNEL = os.getenv("REDIS_CHANNEL", "sems_events")