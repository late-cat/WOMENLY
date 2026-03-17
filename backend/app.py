"""
Womenly — FastAPI Backend
Dual-mode PCOS prediction: Basic (symptoms) + Advanced (symptoms + blood tests)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import joblib
import json
import os
import numpy as np

# ─── Setup ───────────────────────────────────────────────
app = FastAPI(title="Womenly API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model")

# Models and metrics loaded at startup
model_basic = None
model_advanced = None
metrics_data = None


@app.on_event("startup")
def load_models():
    global model_basic, model_advanced, metrics_data

    basic_path = os.path.join(MODEL_DIR, "model_basic.pkl")
    adv_path = os.path.join(MODEL_DIR, "model_advanced.pkl")
    metrics_path = os.path.join(MODEL_DIR, "metrics.json")

    if os.path.exists(basic_path):
        model_basic = joblib.load(basic_path)
        print("✅ Basic model loaded")
    else:
        print("⚠️  model_basic.pkl not found")

    if os.path.exists(adv_path):
        model_advanced = joblib.load(adv_path)
        print("✅ Advanced model loaded")
    else:
        print("⚠️  model_advanced.pkl not found")

    if os.path.exists(metrics_path):
        with open(metrics_path) as f:
            metrics_data = json.load(f)
        print("✅ Metrics loaded")


# ─── Request Models ──────────────────────────────────────
class BasicInput(BaseModel):
    age: float
    bmi: float
    cycle_length: float
    cycle_regularity: int = 0  # from advanced form
    irregular_periods: int = 0  # from basic screening form (alias)
    period_duration: int = 0  # received but not used in model
    weight_gain: int = 0
    hair_growth: int = 0
    skin_darkening: int = 0
    hair_loss: int = 0
    pimples: int = 0
    fast_food: int = 0
    exercise: int = 0


class AdvancedInput(BaseModel):
    # Basic fields
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
    # Blood test fields
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


# ─── Doctor Recommendations ──────────────────────────────
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


# ─── Endpoints ───────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "message": "Womenly API is running"}


@app.post("/predict", response_model=PredictionResponse)
def predict_basic(data: BasicInput):
    if model_basic is None:
        raise HTTPException(503, "Basic model not loaded. Run train_model.py first.")

    # Support both field names from different form versions
    regularity = data.cycle_regularity or data.irregular_periods

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

    features = np.array(
        [
            [
                data.age,
                data.bmi,
                data.cycle_length,
                data.cycle_regularity,
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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
