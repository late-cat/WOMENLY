from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Womenly API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok", "message": "Womenly API is running"}


@app.get("/health")
def health_check():
    return {"backend": "up"}


@app.post("/cycle")
def calculate_cycle():
    return {"message": "cycle route ready"}


@app.post("/predict")
def predict_basic():
    return {"message": "prediction route ready"}
