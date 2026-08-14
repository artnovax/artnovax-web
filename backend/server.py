import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router, migrate_legacy_content_assets
from app.config import CORS_ORIGINS
from app.database import client

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    await migrate_legacy_content_assets()
    yield
    client.close()


app = FastAPI(title="ArtNovaX API", lifespan=lifespan)
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=CORS_ORIGINS != ["*"],
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
