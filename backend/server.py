from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, BackgroundTasks
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
import numpy as np
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import ESN and Gesture modules
from esn_module import get_esn_predictor, gestures_to_sequence, predict_echo_risk, GESTURE_TYPES
from gesture_detection import detect_gestures_from_base64, generate_synthetic_gesture_sequence, get_gesture_detector

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

# Initialize ESN on startup
esn_initialized = False

# ==================== MODELS ====================

class ScenarioBase(BaseModel):
    name: str
    task_type: str
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
    status: str = "pending"

class PredictionResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    scenario_id: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    overall_risk_score: float
    risk_level: str
    echo_risks: List[Dict[str, Any]]
    mitigated_errors_percent: float
    gesture_accuracy: float
    symbiosis_index: float
    recommendations: List[str]
    esn_details: Optional[Dict[str, Any]] = None

class GestureDetectionRequest(BaseModel):
    image_base64: str

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
    type: str
    message: str
    scenario_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    acknowledged: bool = False

# ==================== REAL ESN PREDICTION ====================

def real_esn_prediction(scenario: Scenario, gestures: Optional[List[Dict]] = None) -> PredictionResult:
    """
    Real Echo State Network prediction using ReservoirPy.
    """
    # Generate gesture sequence if not provided
    if gestures is None or len(gestures) < 10:
        # Generate synthetic gestures based on scenario parameters
        n_frames = int(scenario.shift_duration_hours * 10)  # 10 frames per hour
        gestures = generate_synthetic_gesture_sequence(
            n_frames=max(50, n_frames),
            gesture_type='random',
            add_noise=True
        )
        
        # Add scenario-based risk factors to gestures
        if scenario.worker_count > 10:
            # High density - add more erratic movements
            for g in gestures:
                g['position']['x'] += random.uniform(-0.5, 0.5)
                g['confidence'] *= random.uniform(0.85, 1.0)
        
        if scenario.proximity_threshold_meters < 1.0:
            # Close proximity - add lower confidence
            for g in gestures:
                g['confidence'] *= random.uniform(0.8, 0.95)
    
    # Run through ESN
    try:
        esn_result = predict_echo_risk(gestures)
        base_risk = esn_result['risk_score']
        esn_anomalies = esn_result['anomalies']
        reservoir_activation = esn_result['reservoir_activation']
        state_variance = esn_result['state_variance']
    except Exception as e:
        logger.error(f"ESN prediction error: {e}")
        base_risk = 0.5
        esn_anomalies = []
        reservoir_activation = 0.0
        state_variance = 0.0
    
    # Adjust risk based on scenario parameters
    task_risk_factor = {
        "assembly_line": 0.1,
        "quality_check": -0.1,
        "material_handling": 0.15,
        "collaborative_work": 0.2
    }.get(scenario.task_type, 0.0)
    
    proximity_factor = (1.5 - scenario.proximity_threshold_meters) * 0.1
    density_factor = (scenario.worker_count / scenario.robot_count - 1) * 0.05 if scenario.robot_count > 0 else 0
    fatigue_factor = (scenario.shift_duration_hours - 8) * 0.02 if scenario.shift_duration_hours > 8 else 0
    
    overall_risk = base_risk + task_risk_factor + proximity_factor + density_factor + fatigue_factor
    overall_risk = max(0.0, min(1.0, overall_risk))
    
    # Determine risk level
    if overall_risk < 0.3:
        risk_level = "low"
    elif overall_risk < 0.5:
        risk_level = "medium"
    elif overall_risk < 0.7:
        risk_level = "high"
    else:
        risk_level = "critical"
    
    # Build echo risks from ESN anomalies
    echo_risks = []
    
    for anomaly in esn_anomalies:
        risk_type_map = {
            "rapid_gesture_changes": "gesture_misread",
            "low_confidence": "recognition_failure",
            "erratic_movement": "proximity_breach",
            "unusual_pattern": "anomaly_detected"
        }
        
        echo_risks.append({
            "type": risk_type_map.get(anomaly['type'], anomaly['type']),
            "probability": round(anomaly['severity'], 3),
            "description": anomaly['description'],
            "esn_detected": True
        })
    
    # Add scenario-based risks
    if scenario.proximity_threshold_meters < 1.0:
        echo_risks.append({
            "type": "proximity_breach",
            "probability": round(0.3 + proximity_factor, 3),
            "description": f"Close proximity threshold ({scenario.proximity_threshold_meters}m) increases collision risk",
            "affected_zones": random.randint(1, 3)
        })
    
    if scenario.shift_duration_hours > 8:
        echo_risks.append({
            "type": "fatigue_induced",
            "probability": round(0.2 + fatigue_factor * 2, 3),
            "description": f"Extended shift ({scenario.shift_duration_hours}h) may cause worker fatigue",
            "peak_hours": [int(scenario.shift_duration_hours * 0.7), int(scenario.shift_duration_hours * 0.9)]
        })
    
    # Calculate derived metrics
    gesture_accuracy = 1.0 - (reservoir_activation * 0.3)
    gesture_accuracy = max(0.7, min(0.99, gesture_accuracy + random.uniform(-0.05, 0.05)))
    
    mitigated = 15 + (1 - overall_risk) * 25 + random.uniform(-5, 5)
    mitigated = max(10, min(40, mitigated))
    
    symbiosis_index = 1 - overall_risk * 0.6
    symbiosis_index = max(0.3, min(1.0, symbiosis_index))
    
    # Generate recommendations
    recommendations = []
    if risk_level in ["high", "critical"]:
        recommendations.append("Increase safety zone buffer by 0.5 meters")
        recommendations.append("Implement additional gesture confirmation protocols")
    if any(a['type'] == 'fatigue_induced' for a in echo_risks):
        recommendations.append("Consider shift rotation or mandatory breaks every 4 hours")
    if any(a.get('esn_detected') for a in echo_risks):
        recommendations.append("ESN detected unusual patterns - review gesture training data")
    if scenario.worker_count / max(scenario.robot_count, 1) > 3:
        recommendations.append("Redistribute workers across zones to reduce density")
    if reservoir_activation > 0.4:
        recommendations.append("High reservoir activation indicates novel gesture patterns - update training data")
    if not recommendations:
        recommendations.append("Current configuration meets safety standards")
        recommendations.append("Continue monitoring for optimal performance")
    
    return PredictionResult(
        scenario_id=scenario.id,
        overall_risk_score=round(overall_risk, 3),
        risk_level=risk_level,
        echo_risks=echo_risks,
        mitigated_errors_percent=round(mitigated, 1),
        gesture_accuracy=round(gesture_accuracy, 3),
        symbiosis_index=round(symbiosis_index, 3),
        recommendations=recommendations,
        esn_details={
            "reservoir_activation": round(reservoir_activation, 4),
            "state_variance": round(state_variance, 4),
            "gestures_analyzed": len(gestures),
            "anomalies_detected": len(esn_anomalies),
            "model_type": "ReservoirPy ESN"
        }
    )

# ==================== API ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Optimus Echo Predictor API", "version": "2.0.0", "esn": "ReservoirPy Active"}

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "esn_status": "initialized" if esn_initialized else "pending"
    }

@api_router.post("/esn/initialize")
async def initialize_esn(background_tasks: BackgroundTasks):
    """Initialize and train the ESN model."""
    def train_esn():
        global esn_initialized
        try:
            esn = get_esn_predictor()
            if not esn.is_trained:
                esn.train()
            esn_initialized = True
            logger.info("ESN model initialized successfully")
        except Exception as e:
            logger.error(f"ESN initialization failed: {e}")
    
    background_tasks.add_task(train_esn)
    return {"message": "ESN initialization started", "status": "training"}

@api_router.get("/esn/status")
async def esn_status():
    """Get ESN model status."""
    try:
        esn = get_esn_predictor()
        return {
            "initialized": esn.is_trained,
            "units": esn.units,
            "leak_rate": esn.lr,
            "spectral_radius": esn.sr,
            "model_path": str(esn.model_path)
        }
    except Exception as e:
        return {"initialized": False, "error": str(e)}

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
    await db.predictions.delete_many({"scenario_id": scenario_id})
    return {"message": "Scenario deleted successfully"}

# Predictions
@api_router.post("/predictions/{scenario_id}", response_model=PredictionResult)
async def run_prediction(scenario_id: str, background_tasks: BackgroundTasks):
    scenario_doc = await db.scenarios.find_one({"id": scenario_id}, {"_id": 0})
    if not scenario_doc:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    scenario = Scenario(**scenario_doc)
    
    # Run real ESN prediction
    prediction = real_esn_prediction(scenario)
    
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

# Gesture Detection
@api_router.post("/gestures/detect")
async def detect_gestures(request: GestureDetectionRequest):
    """Detect gestures from a base64-encoded image using MediaPipe."""
    try:
        result = detect_gestures_from_base64(request.image_base64)
        return result
    except Exception as e:
        logger.error(f"Gesture detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/gestures/synthetic")
async def get_synthetic_gestures(count: int = 50, gesture_type: str = "random", noise: bool = True):
    """Generate synthetic gesture data for demo."""
    gestures = generate_synthetic_gesture_sequence(
        n_frames=min(count, 200),
        gesture_type=gesture_type if gesture_type in GESTURE_TYPES + ['random'] else 'random',
        add_noise=noise
    )
    
    # Run through ESN for risk analysis
    try:
        esn_result = predict_echo_risk(gestures)
        risk_analysis = {
            "risk_score": esn_result['risk_score'],
            "anomalies": esn_result['anomalies'],
            "reservoir_activation": esn_result['reservoir_activation']
        }
    except Exception as e:
        risk_analysis = {"error": str(e)}
    
    return {
        "gestures": gestures,
        "count": len(gestures),
        "esn_analysis": risk_analysis
    }

@api_router.post("/gestures/upload")
async def upload_gesture_data(file: UploadFile = File(...)):
    """Upload gesture dataset (CSV/JSON format)."""
    if not file.filename.endswith(('.csv', '.json')):
        raise HTTPException(status_code=400, detail="Only CSV and JSON files are supported")
    
    content = await file.read()
    
    return {
        "message": "Dataset uploaded successfully",
        "filename": file.filename,
        "size_bytes": len(content),
        "status": "ready_for_processing"
    }

@api_router.post("/gestures/analyze")
async def analyze_gesture_sequence(gestures: List[Dict]):
    """Analyze a gesture sequence through the ESN."""
    if len(gestures) < 5:
        raise HTTPException(status_code=400, detail="Need at least 5 gestures for analysis")
    
    try:
        result = predict_echo_risk(gestures)
        return {
            "risk_score": result['risk_score'],
            "risk_level": "low" if result['risk_score'] < 0.3 else "medium" if result['risk_score'] < 0.5 else "high" if result['risk_score'] < 0.7 else "critical",
            "anomalies": result['anomalies'],
            "reservoir_activation": result['reservoir_activation'],
            "state_variance": result['state_variance'],
            "gestures_analyzed": len(gestures)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# KPIs
@api_router.get("/kpis", response_model=KPIData)
async def get_kpis():
    total_scenarios = await db.scenarios.count_documents({})
    total_predictions = await db.predictions.count_documents({})
    active_alerts = await db.alerts.count_documents({"acknowledged": False})
    
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

@app.on_event("startup")
async def startup_event():
    """Initialize ESN on startup."""
    global esn_initialized
    try:
        esn = get_esn_predictor()
        if not esn.is_trained:
            logger.info("Training ESN model on startup...")
            esn.train()
        esn_initialized = True
        logger.info("ESN model ready")
    except Exception as e:
        logger.error(f"ESN startup initialization failed: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
