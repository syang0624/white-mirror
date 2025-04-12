from fastapi import FastAPI, APIRouter
from .chat import router as chat_router
from .auth import router as auth_router
from .tables import router as table_router
from .statistics import router as statistics_router

def init_routers(app_: FastAPI) -> None:
    router = APIRouter()
    router.include_router(chat_router, prefix="/chat", tags=["chat"])
    router.include_router(auth_router, prefix="/auth", tags=["auth"])
    router.include_router(table_router, prefix="/tables", tags=["tables"])
    router.include_router(statistics_router, prefix="/statistics", tags=["statistics"])
    app_.include_router(router)

    @app_.get("/health", tags=["health"])
    async def health_check():
        return {"status": "ok"}