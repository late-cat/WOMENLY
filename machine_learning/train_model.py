"""
Womenly — PCOS Prediction Model Training Script

Trains on the PCOS dataset (2000 samples, 44 columns).
Produces two models:
  - model_basic.pkl  (symptoms only — for users without blood tests)
  - model_advanced.pkl (symptoms + blood tests — for users with reports)
And metrics for both: metrics.json

Usage:
    cd machine_learning
    python train_model.py

Dataset note: This dataset exhibits unusually high classification performance
(~99% accuracy).  Results should be interpreted as indicative only.
Cross-validation ROC-AUC is included in metrics to provide a more robust
estimate of generalisation.
"""

import pandas as pd
import numpy as np
import json
import joblib
import os
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    roc_auc_score,
)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(SCRIPT_DIR, "dataset.csv")
DIR = os.path.join(os.path.dirname(SCRIPT_DIR), "backend", "model")
os.makedirs(DIR, exist_ok=True)

BASIC_FEATURES = {
    " Age (yrs)": "age",
    "BMI": "bmi",
    "Cycle length(days)": "cycle_length",
    "Cycle(R/I)": "cycle_regularity",
    "Weight gain(Y/N)": "weight_gain",
    "hair growth(Y/N)": "hair_growth",
    "Skin darkening (Y/N)": "skin_darkening",
    "Hair loss(Y/N)": "hair_loss",
    "Pimples(Y/N)": "pimples",
    "Fast food (Y/N)": "fast_food",
    "Reg.Exercise(Y/N)": "exercise",
}

ADVANCED_EXTRA = {
    "FSH(mIU/mL)": "fsh",
    "LH(mIU/mL)": "lh",
    "AMH(ng/mL)": "amh",
    "TSH (mIU/L)": "tsh",
    "Hb(g/dl)": "hemoglobin",
}

TARGET_COL = "PCOS (Y/N)"


def load_data():
    print(f"Loading: {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    print(f"Shape: {df.shape}")

    df.columns = df.columns.str.strip()

    basic_map = {k.strip(): v for k, v in BASIC_FEATURES.items()}
    adv_map = {k.strip(): v for k, v in ADVANCED_EXTRA.items()}

    all_map = {**basic_map, **adv_map}
    found = {k: v for k, v in all_map.items() if k in df.columns}
    missing = {k: v for k, v in all_map.items() if k not in df.columns}

    if missing:
        print(f"\nMissing columns (will skip): {list(missing.keys())}")
    print(f"Found {len(found)}/{len(all_map)} feature columns")

    df = df.rename(columns=found)

    yn_cols = [
        "weight_gain",
        "hair_growth",
        "skin_darkening",
        "hair_loss",
        "pimples",
        "fast_food",
        "exercise",
    ]
    for col in yn_cols:
        if col in df.columns:
            # Convert to numeric only; NaN will be imputed later on training
            # data so that no information from the test set leaks into the
            # imputation step.
            df[col] = pd.to_numeric(df[col], errors="coerce")

    if "cycle_regularity" in df.columns:
        df["cycle_regularity"] = df["cycle_regularity"].apply(
            lambda x: 1 if str(x).strip() in ["2", "I", "i", "irregular"] else 0
        )

    target = TARGET_COL.strip()
    if target not in df.columns:

        for c in df.columns:
            if "pcos" in c.lower():
                target = c
                break
    df["target"] = pd.to_numeric(df[target], errors="coerce").fillna(0).astype(int)

    basic_cols = [v for k, v in basic_map.items() if v in df.columns]
    advanced_cols = basic_cols + [v for k, v in adv_map.items() if v in df.columns]

    df[basic_cols] = df[basic_cols].apply(pd.to_numeric, errors="coerce")
    df[advanced_cols] = df[advanced_cols].apply(pd.to_numeric, errors="coerce")

    print(f"\nBasic features ({len(basic_cols)}): {basic_cols}")
    print(f"Advanced features ({len(advanced_cols)}): {advanced_cols}")
    print(f"Target distribution:\n{df['target'].value_counts().to_string()}")

    return df, basic_cols, advanced_cols


def train_model(df, feature_cols, model_name):
    print(f"\n{'='*50}")
    print(f"Training: {model_name}")
    print(f"Features: {len(feature_cols)}")
    print(f"{'='*50}")

    data = df[feature_cols + ["target"]].copy()
    X = data[feature_cols].astype(float)
    y = data["target"].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"Train: {len(X_train)}, Test: {len(X_test)}")

    # Pipeline ensures the imputer is fitted ONLY on training data,
    # preventing any leakage of test-set statistics.
    pipeline = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="median")),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=100, max_depth=12, random_state=42, n_jobs=-1
                ),
            ),
        ]
    )
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    auc = roc_auc_score(y_test, y_proba)
    cm = confusion_matrix(y_test, y_pred).tolist()

    # 5-fold stratified cross-validation for a more robust performance estimate.
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_auc_scores = cross_val_score(pipeline, X, y, cv=cv, scoring="roc_auc")
    cv_roc_auc_mean = float(cv_auc_scores.mean())
    cv_roc_auc_std = float(cv_auc_scores.std())

    # Retrieve the imputer medians (fitted on X_train only) for use at
    # inference time when a user field is missing.
    imputer = pipeline.named_steps["imputer"]
    medians = dict(zip(feature_cols, imputer.statistics_.tolist()))

    rf = pipeline.named_steps["classifier"]
    importances = dict(zip(feature_cols, rf.feature_importances_.tolist()))

    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print(f"ROC-AUC:   {auc:.4f}")
    print(f"CV ROC-AUC: {cv_roc_auc_mean:.4f} ± {cv_roc_auc_std:.4f}")
    print(f"Confusion Matrix: {cm}")

    model_path = os.path.join(DIR, f"{model_name}.pkl")
    joblib.dump(pipeline, model_path)
    print(f"Saved: {model_path}")

    return {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1": round(f1, 4),
        "roc_auc": round(auc, 4),
        "cv_roc_auc_mean": round(cv_roc_auc_mean, 4),
        "cv_roc_auc_std": round(cv_roc_auc_std, 4),
        "confusion_matrix": cm,
        "feature_importance": {k: round(v, 4) for k, v in importances.items()},
        "features": feature_cols,
        "medians": {k: round(v, 4) for k, v in medians.items()},
        "train_samples": len(X_train),
        "test_samples": len(X_test),
    }


def main():
    df, basic_cols, advanced_cols = load_data()

    basic_metrics = train_model(df, basic_cols, "model_basic")

    advanced_metrics = train_model(df, advanced_cols, "model_advanced")

    metrics = {
        "basic": basic_metrics,
        "advanced": advanced_metrics,
        "accuracy": advanced_metrics["accuracy"],
        "precision": advanced_metrics["precision"],
        "recall": advanced_metrics["recall"],
        "f1": advanced_metrics["f1"],
        "confusion_matrix": advanced_metrics["confusion_matrix"],
        "feature_importance": advanced_metrics["feature_importance"],
    }

    metrics_path = os.path.join(DIR, "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"\nMetrics saved: {metrics_path}")
    print("\nDone! Both models are ready.")


if __name__ == "__main__":
    main()
