from loguru import logger

from fastapi import FastAPI
from fastapi.middleware import Middleware
from fastapi.middleware.cors import CORSMiddleware
from app.controllers._router import init_routers
from app.core.context import lifespan

def make_middleware() -> list[Middleware]:
    middleware = [
        Middleware(
            CORSMiddleware,
            allow_origins=[
                "http://localhost:3000",
                 "http://localhost:5173",
            ],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        ),
    ]
    return middleware

def create_app() -> FastAPI:
    app = FastAPI(
        title="White Mirror API",
        description="White Mirror API",
        version="0.1.0",
        middleware=make_middleware(),
        lifespan=lifespan,
        responses={
            200: {"description": "OK"},
            400: {"description": "Bad Request"},
            401: {"description": "Unauthorized"},
            403: {"description": "Forbidden"},
            404: {"description": "Not Found"},
            500: {"description": "Internal Server Error"},
        }
    )

    init_routers(app_=app)
    logger.info("App created")
    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)