from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .bike_simulation import BikeRentalSimulation
from datetime import datetime

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

simulation = BikeRentalSimulation(grid_size=4)

@app.get("/api/simulation")
async def get_simulation():
    current_time = datetime.now().time()
    return simulation.run_simulation(current_time=current_time)
