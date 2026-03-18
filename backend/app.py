"""
Womenly — FastAPI Backend
Dual-mode PCOS prediction: Basic (symptoms) + Advanced (symptoms + blood tests)
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import joblib
import json
import os
import numpy as np


model_basic = None
model_advanced = None
metrics_data = None


@asynccontextmanager
async def lifespan(app):
    load_models()
    yield


app = FastAPI(title="Womenly API", version="1.0.0", lifespan=lifespan)

cors_origins_raw = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5500,http://127.0.0.1:5500,http://localhost:8000,http://127.0.0.1:8000",
)
cors_origins = [
    origin.strip() for origin in cors_origins_raw.split(",") if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model")
FRONTEND_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend"
)


def load_models():
    global model_basic, model_advanced, metrics_data

    basic_path = os.path.join(MODEL_DIR, "model_basic.pkl")
    adv_path = os.path.join(MODEL_DIR, "model_advanced.pkl")
    metrics_path = os.path.join(MODEL_DIR, "metrics.json")

    try:
        if (
            not os.path.exists(basic_path)
            or not os.path.exists(adv_path)
            or not os.path.exists(metrics_path)
        ):
            print(
                f"WARNING: Required ML models or metrics missing in {MODEL_DIR}. Prediction endpoints will be unavailable."
            )
            return

        model_basic = joblib.load(basic_path)
        model_advanced = joblib.load(adv_path)
        with open(metrics_path) as f:
            metrics_data = json.load(f)
        print("All models and metrics loaded successfully.")
    except Exception as e:
        print(f"ERROR: Failed to load models: {e}")


class BasicInput(BaseModel):
    age: float
    bmi: float
    cycle_length: float
    cycle_regularity: int = 0
    weight_gain: int = 0
    hair_growth: int = 0
    skin_darkening: int = 0
    hair_loss: int = 0
    pimples: int = 0
    fast_food: int = 0
    exercise: int = 0


class AdvancedInput(BasicInput):
    fsh: float
    lh: float
    amh: float
    tsh: float
    hemoglobin: float


class PredictionResponse(BaseModel):
    risk_level: str
    risk_score: float
    tag_color: str
    doctor_recommendation: str
    mode: str


DOCTOR_REC = {
    "green": (
        "Your indicators look healthy. Continue maintaining a balanced "
        "lifestyle and schedule routine check-ups annually."
    ),
    "yellow": (
        "Some indicators need attention. Consider scheduling a visit with "
        "a gynecologist within the next month for a thorough evaluation."
    ),
    "red": (
        "Multiple risk indicators detected. Please consult a gynecologist "
        "or endocrinologist as soon as possible for proper clinical tests "
        "(ultrasound, hormonal blood panel)."
    ),
}


def get_risk(score):
    if score <= 30:
        return "low", "green"
    elif score <= 60:
        return "moderate", "yellow"
    else:
        return "high", "red"


@app.get("/")
def root():
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"status": "ok", "message": "Womenly API is running"}


@app.post("/predict", response_model=PredictionResponse)
def predict_basic(data: BasicInput):
    if model_basic is None:
        raise HTTPException(503, "Basic model not loaded. Run train_model.py first.")
    regularity = data.cycle_regularity

    features = np.array(
        [
            [
                data.age,
                data.bmi,
                data.cycle_length,
                regularity,
                data.weight_gain,
                data.hair_growth,
                data.skin_darkening,
                data.hair_loss,
                data.pimples,
                data.fast_food,
                data.exercise,
            ]
        ]
    )

    proba = model_basic.predict_proba(features)[0]
    score = float(proba[1]) * 100
    level, color = get_risk(score)

    return PredictionResponse(
        risk_level=level,
        risk_score=round(score, 1),
        tag_color=color,
        doctor_recommendation=DOCTOR_REC[color],
        mode="basic",
    )


@app.post("/predict-advanced", response_model=PredictionResponse)
def predict_advanced(data: AdvancedInput):
    if model_advanced is None:
        raise HTTPException(503, "Advanced model not loaded. Run train_model.py first.")

    regularity = data.cycle_regularity

    features = np.array(
        [
            [
                data.age,
                data.bmi,
                data.cycle_length,
                regularity,
                data.weight_gain,
                data.hair_growth,
                data.skin_darkening,
                data.hair_loss,
                data.pimples,
                data.fast_food,
                data.exercise,
                data.fsh,
                data.lh,
                data.amh,
                data.tsh,
                data.hemoglobin,
            ]
        ]
    )

    proba = model_advanced.predict_proba(features)[0]
    score = float(proba[1]) * 100
    level, color = get_risk(score)

    return PredictionResponse(
        risk_level=level,
        risk_score=round(score, 1),
        tag_color=color,
        doctor_recommendation=DOCTOR_REC[color],
        mode="advanced",
    )


@app.get("/metrics")
def get_metrics():
    if metrics_data is None:
        raise HTTPException(503, "Metrics not available. Run train_model.py first.")
    return metrics_data


@app.get("/health")
def health_check():
    return {
        "basic_model": model_basic is not None,
        "advanced_model": model_advanced is not None,
        "metrics": metrics_data is not None,
    }


@app.get("/js/firebase-config.local.js")
def firebase_local_config_js():
    config = {
        "apiKey": os.getenv("FIREBASE_API_KEY", ""),
        "authDomain": os.getenv("FIREBASE_AUTH_DOMAIN", ""),
        "projectId": os.getenv("FIREBASE_PROJECT_ID", ""),
        "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET", ""),
        "messagingSenderId": os.getenv("FIREBASE_MESSAGING_SENDER_ID", ""),
        "appId": os.getenv("FIREBASE_APP_ID", ""),
    }

    if all(config.values()):
        payload = "window.__WOMENLY_FIREBASE_CONFIG__ = " + json.dumps(config) + ";"
    else:
        payload = "// FIREBASE_* environment variables are not fully configured."

    return Response(content=payload, media_type="application/javascript")


if os.path.isdir(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    is_dev = os.environ.get("ENV", "production").lower() == "development"

    print(f"Starting Womenly API on port {port} (Dev mode: {is_dev})")
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=is_dev)
