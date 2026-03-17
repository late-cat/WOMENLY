# 🌸 Womenly

Womenly is a web-based women's health assistant focused on menstrual awareness, cycle tracking, and early PCOS risk screening. It combines a lightweight static frontend, a FastAPI backend, and a machine learning model to provide two levels of PCOS assessment:

- Basic screening based on symptoms and lifestyle inputs
- AI-assisted advanced screening that integrates user symptoms with clinical blood test values for deeper risk assessment
  
The project also includes Firebase-based authentication and a personal dashboard where users can store monthly screening records and observe longer-term health trends.

## UI Preview

### Home Experience

![Womenly Home Page](docs/screenshots/womenly-home.png)

### Cycle Calculator Experience

![Womenly Cycle Calculator](docs/screenshots/womenly-cycle-calculator.png)

These screens show the practical user journey from awareness-first navigation to actionable cycle insights.



## Why Womenly Matters

Womenly is built to solve a silent but widespread problem: many women still do not feel safe or supported enough to openly discuss reproductive health concerns. In rural and semi-urban communities especially, stigma, limited health literacy, and lack of nearby specialists often delay timely care.

As a result, many users:

- Do not fully understand their menstrual patterns
- Cannot confidently track ovulation and safer windows
- Ignore early symptoms of hormonal imbalance
- Discover PCOS/PCOD only at advanced stages

By the time medical help is sought, complications may already have increased, including emotional stress and fertility-related challenges.

## Problem Statement

Womenly addresses this gap through a private, judgment-free, and easy-to-use digital flow that converts everyday health inputs into actionable awareness.

The platform helps users:

- Track menstrual cycles and recognize patterns
- Identify fertile windows and safer periods
- Monitor irregularities across months
- Get early PCOS risk indications through guided screening

This positions Womenly as an early-awareness companion, not just a fertility calculator.

## Social Impact and Inclusion

Womenly is intentionally designed for accessibility and underserved contexts:

- Low-friction interface for first-time digital health users
- Private self-assessment workflow for stigma-sensitive topics
- Early screening support where immediate clinical access is limited
- Planned regional language support to improve adoption in local communities

Our long-term goal is to make reproductive health awareness more equitable, regardless of geography or income.

## PCOS Awareness Focus

PCOS/PCOD remains one of the most common but underdiagnosed women's health conditions. Womenly introduces a two-stage screening path to increase reach and depth:

- Basic symptom-based mode for broad accessibility
- Advanced mode with clinical inputs for deeper insight

This helps users recognize risk earlier and seek consultation at the right time.

Womenly is a screening and awareness tool. It does not replace professional medical diagnosis.

## Key Features

### 1. Cycle Calculator

Users can estimate:

- Fertile window
- Approximate ovulation period
- Safer days
- Expected next period range

The calculator uses the Standard Rhythm Method based on the user's last menstrual period plus shortest and longest cycle lengths.

### 2. Dual-Mode PCOS Screening

Womenly supports two prediction modes:

- Basic mode: symptom and lifestyle-based screening
- Advanced mode: symptom and lifestyle inputs plus hormone and blood test values

The result includes:

- Risk level: low, moderate, or high
- Risk score as a percentage
- Color-coded tag
- Doctor-oriented recommendation text

### 3. Results Summary

After prediction, the user is redirected to a results page that shows:

- Risk tag and score bar
- Medical recommendation summary
- A readable summary of the user's submitted inputs

### 4. Authentication and User Records

Firebase Authentication is used for sign-up and sign-in. Authenticated users can:

- Save screening results to their profile
- Maintain monthly screening history in Firestore
- Review their records on a personal dashboard

### 5. Dashboard and Pattern Tracking

The dashboard shows:

- Saved monthly screening records
- Risk score history
- Doctor recommendations from previous screenings
- A profile-level risk tag after at least 2 records
- A simple trend label: improving, stable, or worsening

### 6. Model Metrics Page

The metrics page reads live model performance data from the backend and displays:

- Accuracy
- Precision
- Recall
- F1 score
- Confusion matrix
- Feature importance chart

## Tech Stack

### Frontend

- HTML
- CSS
- Vanilla JavaScript
- Chart.js for model feature visualization

### Backend

- FastAPI
- Uvicorn
- Pydantic
- NumPy
- Joblib

### Machine Learning

- scikit-learn
- pandas
- RandomForestClassifier

### Authentication and Database

- Firebase Authentication
- Cloud Firestore

## Project Structure

```text
hakathon-womenly/
├── README.md
├── requirements.txt
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── model/
│       ├── dataset.csv
│       ├── metrics.json
│       ├── model_advanced.pkl
│       ├── model_basic.pkl
│       └── train_model.py
└── frontend/
    ├── index.html
    ├── calculator.html
    ├── screening.html
    ├── results.html
    ├── dashboard.html
    ├── metrics.html
    ├── login.html
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── auth.js
    │   ├── calculator.js
    │   ├── config.js
    │   ├── dashboard.js
    │   ├── firebase-config.js
    │   ├── metrics.js
    │   └── screening.js
    └── assets/
```

## How the System Works

### Frontend Flow

1. The user opens the landing page.
2. They can use the cycle calculator or go to the PCOS screening form.
3. The screening form sends data to the FastAPI backend.
4. The backend returns a prediction response.
5. The result is stored in `sessionStorage` and rendered on the results page.
6. Logged-in users can save results to Firestore.
7. The dashboard reads Firestore records and computes a profile-level tag.

### Backend Flow

When the backend starts:

- It loads `model_basic.pkl`
- It loads `model_advanced.pkl`
- It loads `metrics.json`

Then it exposes API endpoints for:

- Health checking
- Basic prediction
- Advanced prediction
- Metrics retrieval

## API Endpoints

Base URL during local development:

```text
http://localhost:8000
```

### `GET /`

Returns a simple status message.

### `GET /health`

Returns whether the basic model, advanced model, and metrics are loaded.

Example response:

```json
{
	"basic_model": true,
	"advanced_model": true,
	"metrics": true
}
```

### `POST /predict`

Runs the basic screening model.

Expected fields:

- `age`
- `bmi`
- `cycle_length`
- `cycle_regularity`
- `weight_gain`
- `hair_growth`
- `skin_darkening`
- `hair_loss`
- `pimples`
- `fast_food`
- `exercise`

### `POST /predict-advanced`

Runs the advanced screening model.

Expected fields:

- All basic fields
- `fsh`
- `lh`
- `amh`
- `tsh`
- `hemoglobin`

### `GET /metrics`

Returns the stored performance metrics and feature importance values from the training pipeline.

## Machine Learning Pipeline

The training script is located at:

- `backend/model/train_model.py`

It:

- Loads the dataset from `backend/model/dataset.csv`
- Renames source columns into cleaner internal feature names
- Prepares two feature sets: basic and advanced
- Trains two Random Forest models
- Evaluates both models on an 80/20 train-test split
- Saves trained models as `.pkl` files
- Saves metrics to `metrics.json`

### Model Outputs Included in This Repo

- `model_basic.pkl`
- `model_advanced.pkl`
- `metrics.json`

This means the app can run immediately without retraining, as long as dependencies are installed.

### Current Stored Metrics

From the included `metrics.json`:

- Basic model accuracy: `99.0%`
- Basic model F1 score: `98.39%`
- Advanced model accuracy: `99.25%`
- Advanced model F1 score: `98.77%`

These values reflect the saved local training run included in the repository.

## Local Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd hakathon-womenly
```

### 2. Create a Virtual Environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies

Recommended:

```bash
pip install -r requirements.txt
```

The root `requirements.txt` is the safer install target because it includes the ML dependencies used by the training and metrics pipeline.

### 4. Run the Backend

```bash
cd backend
python app.py
```

The API will start on:

```text
http://localhost:8000
```

### 5. Run the Frontend

Because the frontend is static HTML/CSS/JS, you can serve it with a simple local server.

From the `frontend` folder:

```bash
python3 -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

If you use a different frontend port or host, keep `frontend/js/config.js` aligned with the backend URL.

## Firebase Setup

The file below contains placeholder Firebase credentials:

- `frontend/js/firebase-config.js`

Replace the placeholder values with your Firebase project configuration:

- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

Without Firebase configuration:

- Login will not work
- Dashboard data will not load
- Saving results to profile will not work

However, the following can still work locally:

- Home page
- Cycle calculator
- PCOS screening
- Results page
- Metrics page, if backend is running

## Important Files

### Backend

- `backend/app.py`: FastAPI server and prediction endpoints
- `backend/model/train_model.py`: model training pipeline
- `backend/model/metrics.json`: stored evaluation results
- `backend/model/model_basic.pkl`: basic screening model
- `backend/model/model_advanced.pkl`: advanced screening model

### Frontend

- `frontend/index.html`: landing page
- `frontend/calculator.html`: cycle calculator UI
- `frontend/screening.html`: dual-mode PCOS screening UI
- `frontend/results.html`: prediction result rendering and save flow
- `frontend/dashboard.html`: user dashboard
- `frontend/metrics.html`: live model metrics visualization
- `frontend/login.html`: Firebase auth page

### JavaScript Logic

- `frontend/js/config.js`: backend base URL
- `frontend/js/auth.js`: auth form behavior
- `frontend/js/dashboard.js`: dashboard rendering and trend logic
- `frontend/js/metrics.js`: fetches and renders model metrics
- `frontend/js/calculator.js`: cycle date calculations

## Sample Use Cases

### For a general user

- Estimate fertile days using the cycle calculator
- Complete a monthly symptom screening
- Save results after logging in
- Observe changes in risk over time on the dashboard

### For a user with lab reports

- Choose advanced screening
- Enter FSH, LH, AMH, TSH, and hemoglobin values
- Receive a more detailed prediction score

### For reviewers and judges

- Open the landing page to understand the workflow
- Test both screening modes
- Visit the model metrics page to inspect performance outputs
- Review the dashboard flow with Firebase configured
- Evaluate the inclusion objective: early awareness support for users with limited clinical access

## Limitations

- This is not a medical diagnosis tool
- Model quality depends on the training dataset used
- Firebase configuration is required for authentication and saved history
- The frontend is static and does not use a build system
- Some backend dependencies are managed through the root `requirements.txt`, so using only `backend/requirements.txt` may be insufficient for retraining the model

## Future Improvements

- Add stronger form validation and error states
- Add historical charts to the dashboard
- Add export/download support for saved health reports
- Add appointment and doctor referral workflows
- Add multilingual support and better accessibility coverage
- Deploy frontend and backend with environment-based configuration

## Disclaimer

Womenly is intended for educational screening and awareness. It should not be used as a substitute for professional medical advice, diagnosis, or treatment.
