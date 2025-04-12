from fastapi import FastAPI, APIRouter

def init_routers(app_: FastAPI) -> None:
    router = APIRouter()

    app_.include_router(router)