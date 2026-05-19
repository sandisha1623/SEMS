from fastapi import FastAPI
from app.core.security import verify_token
from app.api.routes.websocket import router as websocket_router

app = FastAPI(title="SEMS AI Service")

app.include_router(websocket_router)

@app.get("/")
async def root():

    return {
        "status": "running",
        "service": "SEMS AI"
    }

@app.get("/verify")
async def verify(token: str):

    payload = verify_token(token)

    return {
        "valid": True,
        "payload": payload
    }