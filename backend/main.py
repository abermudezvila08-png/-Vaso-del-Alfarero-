from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.database import async_session, init_db
from backend.routers.auth_router import router as auth_router
from backend.routers.packages_router import router as packages_router
from backend.routers.reservations_router import router as reservations_router
from backend.routers.tables_router import router as tables_router
from backend.routers.timeslots_router import router as timeslots_router
from backend.seed import seed_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    async with async_session() as db:
        await seed_data(db)
    yield


app = FastAPI(
    title="Sistema de Reservación de Restaurante",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(tables_router)
app.include_router(timeslots_router)
app.include_router(packages_router)
app.include_router(reservations_router)

# Serve frontend static files (built React app)
frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
