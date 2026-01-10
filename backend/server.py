from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import random
import math

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Optimus Echo Predictor API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class ScenarioBase(BaseModel):
    name: str
    task_type: str  # assembly_line, quality_check, material_handling, collaborative_work
    worker_count: int = Field(ge=1, le=50)
    robot_count: int = Field(ge=1, le=20)
    shift_duration_hours: float = Field(ge=1, le=12)
    proximity_threshold_meters: float = Field(ge=0.5, le=5.0, default=1.5)
    description: Optional[str] = None

class ScenarioCreate(ScenarioBase):
    pass

class Scenario(ScenarioBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    status: str = "pending"  # pending, analyzed, archived

class PredictionResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    scenario_id: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    overall_risk_score: float
    risk_level: str  # low, medium, high, critical
    echo_risks: List[Dict[str, Any]]
    mitigated_errors_percent: float
    gesture_accuracy: float
    symbiosis_index: float
    recommendations: List[str]

class GestureData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    gesture_type: str
    confidence: float
    timestamp: str
    source: str  # synthetic, uploaded, roboflow

class KPIData(BaseModel):
    total_scenarios: int
    total_predictions: int
    avg_risk_score: float
    mitigated_errors_total: float
    active_alerts: int
    symbiosis_health: float

class Alert(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # warning, danger, info
    message: str
    scenario_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    acknowledged: bool = False

# ==================== MOCK ECHO STATE NETWORK ====================

def mock_echo_prediction(scenario: Scenario) -> PredictionResult:
    """
    Mocked Echo State Network prediction.
    In production, this would use ReservoirPy for actual echo state computations.
    """
    # Base risk factors
    worker_density = scenario.worker_count / max(scenario.robot_count, 1)
    task_complexity = {
        "assembly_line": 0.6,
        "quality_check": 0.4,
        "material_handling": 0.7,
        "collaborative_work": 0.8
    }.get(scenario.task_type, 0.5)
    
    proximity_risk = 1 - (scenario.proximity_threshold_meters / 5.0)
    time_fatigue = min(scenario.shift_duration_hours / 12.0, 1.0)
    
    # Echo state network simulation (mock)
    # In real implementation, this would process time-series gesture data
    base_risk = (worker_density * 0.2 + task_complexity * 0.3 + 
                 proximity_risk * 0.3 + time_fatigue * 0.2)
    
    # Add some randomness to simulate network variance
    noise = random.uniform(-0.1, 0.1)
    overall_risk = max(0.0, min(1.0, base_risk + noise))
    
    # Determine risk level
    if overall_risk < 0.3:
        risk_level = "low"
    elif overall_risk < 0.5:
        risk_level = "medium"
    elif overall_risk < 0.7:
        risk_level = "high"
    else:
        risk_level = "critical"
    
    # Generate echo risks (specific interaction risks)
    echo_risks = []
    
    if task_complexity > 0.5:
        echo_risks.append({
            "type": "gesture_misread",
            "probability": round(random.uniform(0.1, 0.35), 3),
            "description": "Robot may misinterpret worker gestures during complex tasks",
            "affected_workers": random.randint(1, min(5, scenario.worker_count))
        })
    
    if proximity_risk > 0.5:
        echo_risks.append({
            "type": "proximity_breach",
            "probability": round(random.uniform(0.15, 0.4), 3),
            "description": "High probability of safety zone violations",
            "affected_zones": random.randint(1, 3)
        })
    
    if time_fatigue > 0.6:
        echo_risks.append({
            "type": "fatigue_induced",
            "probability": round(random.uniform(0.2, 0.45), 3),
            "description": "Worker fatigue may lead to unpredictable movements",
            "peak_hours": [random.randint(4, 6), random.randint(7, 10)]
        })
    
    if worker_density > 2:
        echo_risks.append({
            "type": "crowding_interference",
            "probability": round(random.uniform(0.25, 0.5), 3),
            "description": "Multiple workers may cause sensor confusion",
            "critical_areas": ["workstation_A", "assembly_zone"]
        })
    
    # Calculate derived metrics
    mitigated = round(random.uniform(15, 35), 1)
    gesture_accuracy = round(random.uniform(0.85, 0.98), 3)
    symbiosis_index = round(1 - overall_risk * 0.7, 3)
    
    # Generate recommendations
    recommendations = []
    if risk_level in ["high", "critical"]:
        recommendations.append("Increase safety zone buffer by 0.5 meters")
        recommendations.append("Implement additional gesture confirmation protocols")
    if time_fatigue > 0.6:
        recommendations.append("Consider shift rotation or mandatory breaks")
    if worker_density > 2:
        recommendations.append("Redistribute workers across zones to reduce density")
    if not recommendations:
        recommendations.append("Current configuration meets safety standards")
        recommendations.append("Continue monitoring for optimal performance")
    
    return PredictionResult(
        scenario_id=scenario.id,
        overall_risk_score=round(overall_risk, 3),
        risk_level=risk_level,
        echo_risks=echo_risks,
        mitigated_errors_percent=mitigated,
        gesture_accuracy=gesture_accuracy,
        symbiosis_index=symbiosis_index,
        recommendations=recommendations
    )

def generate_synthetic_gestures(count: int = 50) -> List[Dict]:
    """Generate synthetic gesture data for demo purposes."""
    gesture_types = ["stop", "proceed", "slow_down", "handover", "point", "wave", "emergency"]
    sources = ["synthetic", "opencv_simulated"]
    
    gestures = []
    base_time = datetime.now(timezone.utc)
    
    for i in range(count):
        gesture = {
            "id": str(uuid.uuid4()),
            "gesture_type": random.choice(gesture_types),
            "confidence": round(random.uniform(0.7, 0.99), 3),
            "timestamp": (base_time.replace(second=i % 60)).isoformat(),
            "source": random.choice(sources),
            "position": {
                "x": round(random.uniform(-2, 2), 2),
                "y": round(random.uniform(0, 2), 2),
                "z": round(random.uniform(-1, 1), 2)
            }
        }
        gestures.append(gesture)
    
    return gestures

# ==================== API ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Optimus Echo Predictor API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Scenarios CRUD
@api_router.post("/scenarios", response_model=Scenario)
async def create_scenario(scenario_data: ScenarioCreate):
    scenario = Scenario(**scenario_data.model_dump())
    doc = scenario.model_dump()
    await db.scenarios.insert_one(doc)
    return scenario

@api_router.get("/scenarios", response_model=List[Scenario])
async def get_scenarios():
    scenarios = await db.scenarios.find({}, {"_id": 0}).to_list(100)
    return scenarios

@api_router.get("/scenarios/{scenario_id}", response_model=Scenario)
async def get_scenario(scenario_id: str):
    scenario = await db.scenarios.find_one({"id": scenario_id}, {"_id": 0})
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario

@api_router.delete("/scenarios/{scenario_id}")
async def delete_scenario(scenario_id: str):
    result = await db.scenarios.delete_one({"id": scenario_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Scenario not found")
    # Also delete related predictions
    await db.predictions.delete_many({"scenario_id": scenario_id})
    return {"message": "Scenario deleted successfully"}

# Predictions
@api_router.post("/predictions/{scenario_id}", response_model=PredictionResult)
async def run_prediction(scenario_id: str):
    scenario_doc = await db.scenarios.find_one({"id": scenario_id}, {"_id": 0})
    if not scenario_doc:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    scenario = Scenario(**scenario_doc)
    prediction = mock_echo_prediction(scenario)
    
    # Store prediction
    await db.predictions.insert_one(prediction.model_dump())
    
    # Update scenario status
    await db.scenarios.update_one(
        {"id": scenario_id},
        {"$set": {"status": "analyzed"}}
    )
    
    # Create alerts if risk is high
    if prediction.risk_level in ["high", "critical"]:
        alert = Alert(
            type="danger" if prediction.risk_level == "critical" else "warning",
            message=f"High risk detected: {prediction.overall_risk_score:.1%} risk score for scenario '{scenario.name}'",
            scenario_id=scenario_id
        )
        await db.alerts.insert_one(alert.model_dump())
    
    return prediction

@api_router.get("/predictions", response_model=List[PredictionResult])
async def get_predictions(scenario_id: Optional[str] = None):
    query = {"scenario_id": scenario_id} if scenario_id else {}
    predictions = await db.predictions.find(query, {"_id": 0}).to_list(100)
    return predictions

@api_router.get("/predictions/{prediction_id}", response_model=PredictionResult)
async def get_prediction(prediction_id: str):
    prediction = await db.predictions.find_one({"id": prediction_id}, {"_id": 0})
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return prediction

# Gestures
@api_router.get("/gestures/synthetic")
async def get_synthetic_gestures(count: int = 50):
    """Generate synthetic gesture data for demo."""
    gestures = generate_synthetic_gestures(min(count, 200))
    return {"gestures": gestures, "count": len(gestures)}

@api_router.post("/gestures/upload")
async def upload_gesture_data(file: UploadFile = File(...)):
    """Upload gesture dataset (CSV/JSON format)."""
    if not file.filename.endswith(('.csv', '.json')):
        raise HTTPException(status_code=400, detail="Only CSV and JSON files are supported")
    
    content = await file.read()
    # In production, this would parse and validate the data
    # For MVP, we acknowledge the upload
    
    return {
        "message": "Dataset uploaded successfully",
        "filename": file.filename,
        "size_bytes": len(content),
        "note": "Mocked processing - real integration available in future iterations"
    }

# KPIs
@api_router.get("/kpis", response_model=KPIData)
async def get_kpis():
    total_scenarios = await db.scenarios.count_documents({})
    total_predictions = await db.predictions.count_documents({})
    active_alerts = await db.alerts.count_documents({"acknowledged": False})
    
    # Calculate averages from predictions
    pipeline = [
        {"$group": {
            "_id": None,
            "avg_risk": {"$avg": "$overall_risk_score"},
            "avg_mitigated": {"$avg": "$mitigated_errors_percent"},
            "avg_symbiosis": {"$avg": "$symbiosis_index"}
        }}
    ]
    
    agg_result = await db.predictions.aggregate(pipeline).to_list(1)
    
    if agg_result:
        avg_risk = agg_result[0].get("avg_risk", 0.35)
        avg_mitigated = agg_result[0].get("avg_mitigated", 22)
        symbiosis_health = agg_result[0].get("avg_symbiosis", 0.75)
    else:
        avg_risk = 0.35
        avg_mitigated = 22
        symbiosis_health = 0.75
    
    return KPIData(
        total_scenarios=total_scenarios,
        total_predictions=total_predictions,
        avg_risk_score=round(avg_risk, 3),
        mitigated_errors_total=round(avg_mitigated, 1),
        active_alerts=active_alerts,
        symbiosis_health=round(symbiosis_health, 3)
    )

# Alerts
@api_router.get("/alerts", response_model=List[Alert])
async def get_alerts(acknowledged: Optional[bool] = None):
    query = {} if acknowledged is None else {"acknowledged": acknowledged}
    alerts = await db.alerts.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return alerts

@api_router.patch("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    result = await db.alerts.update_one(
        {"id": alert_id},
        {"$set": {"acknowledged": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert acknowledged"}

# Chart data endpoints
@api_router.get("/charts/risk-distribution")
async def get_risk_distribution():
    """Get risk distribution for charts."""
    predictions = await db.predictions.find({}, {"_id": 0, "risk_level": 1}).to_list(1000)
    
    distribution = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    for pred in predictions:
        level = pred.get("risk_level", "low")
        distribution[level] = distribution.get(level, 0) + 1
    
    return [
        {"name": "Low", "value": distribution["low"], "fill": "#00FF9D"},
        {"name": "Medium", "value": distribution["medium"], "fill": "#FFB800"},
        {"name": "High", "value": distribution["high"], "fill": "#FF4D00"},
        {"name": "Critical", "value": distribution["critical"], "fill": "#FF0000"}
    ]

@api_router.get("/charts/error-rates")
async def get_error_rates():
    """Get error rates over time for charts."""
    # Generate mock time-series data
    data = []
    for i in range(7):
        data.append({
            "day": f"Day {i+1}",
            "gesture_errors": round(random.uniform(5, 25), 1),
            "proximity_breaches": round(random.uniform(2, 15), 1),
            "mitigated": round(random.uniform(15, 35), 1)
        })
    return data

@api_router.get("/charts/symbiosis-trend")
async def get_symbiosis_trend():
    """Get symbiosis index trend over time."""
    data = []
    base_value = 0.7
    for i in range(30):
        value = base_value + random.uniform(-0.1, 0.15)
        value = max(0.5, min(1.0, value))
        base_value = value
        data.append({
            "day": i + 1,
            "symbiosis": round(value, 3),
            "target": 0.85
        })
    return data

# Include the router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
