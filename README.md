# Womenly

Womenly is an AI-enabled menstrual health and early PCOS risk awareness platform designed to make reproductive health support more private, accessible, and actionable.

## Team and Links

- Team Name: Vision-X
- Live Deployment: https://womenly.onrender.com
- GitHub Repository: https://github.com/late-cat/WOMENLY

## Project Vision

Many women delay reproductive health checks because of stigma, low awareness, limited specialist access, or cost barriers. Womenly addresses this by combining:

- Cycle awareness tools for day-to-day self-management
- Dual-mode PCOS risk screening for both low-resource and clinical-input scenarios
- Personal history tracking to identify patterns over time

Womenly is an awareness and early-screening assistant, not a medical diagnosis system.

## Why This Solution Stands Out

### Innovation and Creativity

- Dual-path prediction design:
  - Basic model for users with only symptom and lifestyle information
  - Advanced model for users who also have lab values (FSH, LH, AMH, TSH, Hemoglobin)
- One product with two accessibility levels, so users can start simple and move to deeper screening when reports are available
- Monthly record tracking and profile-level trend interpretation to shift from one-time screening to continuous awareness
- Runtime-ready configuration support for both API and Firebase environments

### Technical Complexity

- End-to-end architecture across multiple layers:
  - Static frontend (HTML/CSS/Vanilla JS)
  - FastAPI backend with typed request and response models
  - ML training pipeline with data cleaning, feature mapping, model training, and metric export
  - Firebase Authentication and Firestore for identity and longitudinal records
- Two separate RandomForest pipelines trained from a shared dataset with different feature subsets
- Graceful backend behavior when model artifacts are missing (service stays up, prediction endpoints return clear status errors)
- Metrics endpoint and visualization page (accuracy, precision, recall, F1, confusion matrix, feature importance)

### Feasibility and Scalability

- Deployment-ready on Render with environment-based port binding
- Stateless API design, straightforward to scale horizontally
- Runtime API base URL resolution in frontend for flexible hosting environments
- Model artifacts persisted under backend/model for fast startup without mandatory retraining
- Decoupled frontend and backend structure allows independent scaling in later iterations

### Real-World Impact

- Helps users detect risk signals earlier and seek medical consultation sooner
- Supports private self-assessment for stigma-sensitive health contexts
- Improves continuity through monthly records and trend visibility
- Reduces adoption friction in underserved communities where specialist access is delayed

## Product Features

### 1) Cycle Calculator

Computes:

- Fertile window
- Approximate ovulation range
- Safer days
- Expected next period window

Method: standard rhythm calculations based on LMP and shortest/longest cycle lengths.

### 2) Dual-Mode PCOS Screening

- Basic endpoint: symptoms and lifestyle factors
- Advanced endpoint: basic factors plus blood test markers

Response includes:

- Risk level (low/moderate/high)
- Risk score (%)
- Tag color (green/yellow/red)
- Doctor recommendation text

### 3) Results Experience

- Presents risk tag and score visualization
- Shows doctor-oriented recommendation
- Displays user-submitted factors in readable form
- Supports saving records for logged-in users

### 4) Auth, Persistence, and Dashboard

- Google authentication via Firebase
- Record storage in Firestore under user profile
- Dashboard with history table, profile-level risk summary, and trend direction (improving/stable/worsening)
- Local fallback behavior for record visibility when cloud write/read is interrupted

### 5) Model Metrics View

- Reads backend metrics endpoint
- Displays confusion matrix and feature importances
- Handles unavailable model state gracefully in UI

## Architecture Overview

### Frontend

- Pages: home, calculator, screening, results, dashboard, metrics, login
- Stack: HTML, CSS, Vanilla JS, Chart.js
- Runtime config:
  - API URL can be injected via window.__WOMENLY_API_URL__
  - Firebase config can be injected via window.__WOMENLY_FIREBASE_CONFIG__

### Backend (FastAPI)

Core endpoints:

- GET /
- GET /health
- POST /predict
- POST /predict-advanced
- GET /metrics
- GET /js/firebase-config.local.js

Backend behavior:

- Loads model_basic.pkl, model_advanced.pkl, and metrics.json on startup
- Mounts frontend static files at root when present
- Uses ENV and PORT environment variables for development/production runtime control

### Machine Learning Pipeline

Training script: machine_learning/train_model.py

Pipeline responsibilities:

- Read and clean dataset
- Normalize feature names
- Build two feature sets (basic and advanced)
- Train two RandomForestClassifier models
- Evaluate with accuracy, precision, recall, F1, and confusion matrix
- Save model artifacts and metrics into backend/model

## Current Model Snapshot

From backend/model/metrics.json:

- Basic model:
  - Accuracy: 99.00%
  - F1: 98.39%
- Advanced model:
  - Accuracy: 99.25%
  - Precision: 99.17%
  - Recall: 98.36%
  - F1: 98.77%

Note: these metrics are from the included training artifact and may vary if retrained with updated data.

## Tech Stack

- Frontend: HTML, CSS, Vanilla JavaScript, Chart.js
- Backend: FastAPI, Uvicorn, Pydantic, NumPy, Joblib
- Machine Learning: pandas, scikit-learn, RandomForestClassifier
- Authentication and Database: Firebase Authentication, Cloud Firestore

## Project Structure

```text
hakathon-womenly/
├── README.md
├── requirements.txt
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── model/
│       ├── metrics.json
│       ├── model_basic.pkl
│       └── model_advanced.pkl
├── machine_learning/
│   ├── dataset.csv
│   └── train_model.py
├── frontend/
│   ├── index.html
│   ├── calculator.html
│   ├── screening.html
│   ├── results.html
│   ├── dashboard.html
│   ├── metrics.html
│   ├── login.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── auth.js
│       ├── calculator.js
│       ├── config.js
│       ├── dashboard.js
│       ├── firebase-config.js
│       ├── metrics.js
│       ├── results.js
│       └── screening.js
└── docs/
    └── screenshots/
```

## UI Preview

![Womenly Home Page](docs/screenshots/womenly-home.png)
![Womenly Cycle Calculator](docs/screenshots/womenly-cycle-calculator.png)

## Local Setup

### 1) Clone and enter

```bash
git clone https://github.com/late-cat/WOMENLY.git
cd hakathon-womenly
```

### 2) Create and activate virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3) Install dependencies

```bash
pip install -r requirements.txt
```

### 4) Run backend

```bash
cd backend
python app.py
```

Backend URL: http://localhost:8000

### 5) Run frontend separately (optional)

```bash
cd frontend
python3 -m http.server 5500
```

Frontend URL: http://localhost:5500

## Firebase Setup

Womenly supports two configuration patterns:

- Direct file configuration in frontend/js/firebase-config.js
- Runtime injection by defining window.__WOMENLY_FIREBASE_CONFIG__ before Firebase initialization

Without valid Firebase config:

- Google login will not work
- Dashboard cloud history will not load/save

## Deployment Notes (Render)

- App supports Render-style PORT binding
- Static frontend is mounted by FastAPI at /
- Keep backend/model artifacts available in deployment image, or run training during build
- Set ENV=development only for local-style hot reload behavior
- On Render free tier, the first request after inactivity may take some time due to cold starts. Please wait for the app to wake up.

Live URL: https://womenly.onrender.com

## Limitations

- Not a clinical diagnostic tool
- Output quality depends on dataset quality and representativeness
- Full authenticated experience requires internet and Firebase setup
- No multilingual UI yet

## Future Roadmap

- Multilingual and low-literacy UX support
- Better explainability layer for risk factors
- Role-based clinician review interface
- Stronger offline-first and sync-resilience behavior
- Expanded datasets for broader population generalization

---

Built by Vision-X for practical, privacy-aware women's health awareness.
