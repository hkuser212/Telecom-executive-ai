from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
import os
import io
import xgboost as xgb

app = FastAPI(title="Executive AI Decision Dashboard API")

# Setup CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load saved models
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ml_models', 'saved_models')

try:
    xgb_model = joblib.load(os.path.join(MODEL_DIR, 'churn_xgboost.joblib'))
    scaler = joblib.load(os.path.join(MODEL_DIR, 'churn_scaler.joblib'))
    label_encoders = joblib.load(os.path.join(MODEL_DIR, 'churn_label_encoders.joblib'))
    feature_columns = joblib.load(os.path.join(MODEL_DIR, 'churn_features.joblib'))
    print("Models loaded successfully")
except Exception as e:
    print(f"Error loading models: {e}")
    xgb_model, scaler, label_encoders, feature_columns = None, None, None, None

class CustomerData(BaseModel):
    gender: str = "Female"
    SeniorCitizen: int = 0
    Partner: str = "Yes"
    Dependents: str = "No"
    tenure: int = 1
    PhoneService: str = "No"
    MultipleLines: str = "No phone service"
    InternetService: str = "DSL"
    OnlineSecurity: str = "No"
    OnlineBackup: str = "Yes"
    DeviceProtection: str = "No"
    TechSupport: str = "No"
    StreamingTV: str = "No"
    StreamingMovies: str = "No"
    Contract: str = "Month-to-month"
    PaperlessBilling: str = "Yes"
    PaymentMethod: str = "Electronic check"
    MonthlyCharges: float = 29.85
    TotalCharges: float = 29.85

@app.get("/")
def read_root():
    return {"message": "Welcome to Executive AI Decision Dashboard API"}

@app.post("/predict-churn")
def predict_churn(customer: CustomerData):
    if not xgb_model:
        raise HTTPException(status_code=500, detail="Models not loaded")

    # Create a DataFrame from the input data
    input_data = pd.DataFrame([customer.dict()])
    
    # Feature Engineering
    def tenure_group(t):
        if t <= 12: return '0-1_Year'
        elif t <= 24: return '1-2_Years'
        elif t <= 36: return '2-3_Years'
        elif t <= 48: return '3-4_Years'
        elif t <= 60: return '4-5_Years'
        else: return '5+_Years'
    
    input_data['Tenure_Group'] = input_data['tenure'].apply(tenure_group)
    
    # Process binary columns
    binary_cols = ['gender', 'Partner', 'Dependents', 'PhoneService', 'PaperlessBilling']
    for col in binary_cols:
        if col in label_encoders:
            # Handle unseen labels by setting to a default or raising error, here we assume clean data
            input_data[col] = label_encoders[col].transform(input_data[col])

    # Get dummies for multi-class categorical columns
    multi_cols = ['MultipleLines', 'InternetService', 'OnlineSecurity', 'OnlineBackup', 
                  'DeviceProtection', 'TechSupport', 'StreamingTV', 'StreamingMovies', 
                  'Contract', 'PaymentMethod', 'Tenure_Group']
    input_data = pd.get_dummies(input_data, columns=multi_cols, drop_first=True)
    
    # Align features with the trained model's features (fill missing with 0)
    # This ensures that even if a category wasn't in the input, the dummy column is created
    for col in feature_columns:
        if col not in input_data.columns:
            input_data[col] = 0
            
    # Ensure correct column order
    input_data = input_data[feature_columns]
    
    # Scale numerical features
    num_cols = ['tenure', 'MonthlyCharges', 'TotalCharges']
    input_data[num_cols] = scaler.transform(input_data[num_cols])
    
    # Predict
    churn_prob = float(xgb_model.predict_proba(input_data)[0][1])
    churn_pred = int(xgb_model.predict(input_data)[0])
    
    return {
        "churn_probability": churn_prob,
        "is_high_risk": bool(churn_pred),
        "risk_score": int(churn_prob * 100)
    }

@app.post("/predict-churn-batch")
async def predict_churn_batch(file: UploadFile = File(...)):
    if not xgb_model:
        raise HTTPException(status_code=500, detail="Models not loaded")
    
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV: {e}")
        
    if 'tenure' not in df.columns:
        raise HTTPException(status_code=400, detail="Missing required column 'tenure'")
    
    df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
    df['TotalCharges'].fillna(0, inplace=True)
    
    input_data = df.copy()
    
    def tenure_group(t):
        if t <= 12: return '0-1_Year'
        elif t <= 24: return '1-2_Years'
        elif t <= 36: return '2-3_Years'
        elif t <= 48: return '3-4_Years'
        elif t <= 60: return '4-5_Years'
        else: return '5+_Years'
    
    input_data['Tenure_Group'] = input_data['tenure'].apply(tenure_group)
    
    binary_cols = ['gender', 'Partner', 'Dependents', 'PhoneService', 'PaperlessBilling']
    for col in binary_cols:
        if col in label_encoders and col in input_data.columns:
            classes = list(label_encoders[col].classes_)
            input_data[col] = input_data[col].map(lambda s: label_encoders[col].transform([s])[0] if s in classes else 0)

    multi_cols = ['MultipleLines', 'InternetService', 'OnlineSecurity', 'OnlineBackup', 
                  'DeviceProtection', 'TechSupport', 'StreamingTV', 'StreamingMovies', 
                  'Contract', 'PaymentMethod', 'Tenure_Group']
    
    cols_to_encode = [c for c in multi_cols if c in input_data.columns]
    input_data = pd.get_dummies(input_data, columns=cols_to_encode, drop_first=True)
    
    for col in feature_columns:
        if col not in input_data.columns:
            input_data[col] = 0
            
    input_data = input_data[feature_columns]
    
    num_cols = ['tenure', 'MonthlyCharges', 'TotalCharges']
    input_data[num_cols] = scaler.transform(input_data[num_cols])
    
    probs = xgb_model.predict_proba(input_data)[:, 1]
    
    df['RiskScore'] = (probs * 100).astype(int)
    # Sort and filter high risk
    high_risk_df = df[df['RiskScore'] >= 60].sort_values(by='RiskScore', ascending=False)
    
    # Fill NaN so JSON serialization doesn't fail
    high_risk_df = high_risk_df.fillna("")
    
    results = high_risk_df.head(50).to_dict('records')
    
    return {"high_risk_customers": results, "total_processed": len(df)}

@app.get("/forecast-sales")
def forecast_sales():
    return {"status": "Not Implemented"}
