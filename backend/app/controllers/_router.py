from fastapi import FastAPI, APIRouter
#from .chat.room import router as chat_router
#from .auth import router as auth_router

def init_routers(app_: FastAPI) -> None:
    router = APIRouter()
    #router.include_router(chat_router, prefix="/chat", tags=["chat"])
    #router.include_router(auth_router, prefix="/auth", tags=["auth"])
    app_.include_router(router)

    @app_.get("/health", tags=["health"])
    async def health_check():
        return {"status": "ok"}