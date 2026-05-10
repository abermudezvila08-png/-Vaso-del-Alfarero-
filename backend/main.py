from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.database import async_session, init_db
import backend.models_inventory  # noqa: F401
import backend.payments  # noqa: F401
import backend.suppliers  # noqa: F401
import backend.waste  # noqa: F401
import backend.currency  # noqa: F401
from backend.routers.auth_router import router as auth_router
from backend.routers.inventory_router import router as inventory_router
from backend.routers.norms_router import router as norms_router
from backend.routers.packages_router import router as packages_router
from backend.routers.predictions_router import router as predictions_router
from backend.routers.recipes_router import router as recipes_router
from backend.routers.reservations_router import router as reservations_router
from backend.routers.tables_router import router as tables_router
from backend.routers.timeslots_router import router as timeslots_router
from backend.routers.menu_router import router as menu_router
from backend.routers.currency_router import router as currency_router
from backend.routers.supplier_router import router as supplier_router
from backend.routers.waste_router import router as waste_router
from backend.routers.qr_router import router as qr_router
from backend.routers.alerts_router import router as alerts_router
from backend.routers.dashboard_router import router as dashboard_router
from backend.routers.export_router import router as export_router
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
app.include_router(inventory_router)
app.include_router(recipes_router)
app.include_router(norms_router)
app.include_router(predictions_router)
app.include_router(menu_router)
app.include_router(currency_router)
app.include_router(supplier_router)
app.include_router(waste_router)
app.include_router(qr_router)
app.include_router(alerts_router)
app.include_router(dashboard_router)
app.include_router(export_router)

# Serve frontend static files (built React app)
frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
