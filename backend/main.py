from fastapi import FastAPI, HTTPException, File, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorClient
import os, io, joblib, xgboost, pandas as pd
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from dotenv import load_dotenv

load_dotenv()

# ─── Config ────────────────────────────────────────────────
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
JWT_SECRET = os.getenv("JWT_SECRET", "changeme")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", 1440))

# ─── App ────────────────────────────────────────────────────
app = FastAPI(title="Executive AI Decision Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── MongoDB ────────────────────────────────────────────────
mongo_client = AsyncIOMotorClient(MONGODB_URI)
db = mongo_client["telecom_ai"]
users_col = db["users"]

# ─── Auth helpers ───────────────────────────────────────────
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_ctx.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)

def create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

# ─── Pydantic models ────────────────────────────────────────
class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

# ─── Auth Routes ─────────────────────────────────────────────
@app.post("/auth/signup")
async def signup(body: SignupRequest):
    existing = await users_col.find_one({"email": body.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    user_doc = {
        "name": body.name,
        "email": body.email,
        "password": hash_password(body.password),
        "created_at": datetime.utcnow().isoformat()
    }
    result = await users_col.insert_one(user_doc)
    return {"message": "Account created successfully", "user_id": str(result.inserted_id)}

@app.post("/auth/login")
async def login(body: LoginRequest):
    user = await users_col.find_one({"email": body.email})
    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token({"sub": str(user["_id"]), "email": user["email"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"name": user["name"], "email": user["email"]}
    }

# ─── Load ML Models ──────────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ml_models', 'saved_models')

try:
    xgb_model = joblib.load(os.path.join(MODEL_DIR, 'churn_xgboost.joblib'))
    scaler = joblib.load(os.path.join(MODEL_DIR, 'churn_scaler.joblib'))
    label_encoders = joblib.load(os.path.join(MODEL_DIR, 'churn_label_encoders.joblib'))
    feature_columns = joblib.load(os.path.join(MODEL_DIR, 'churn_features.joblib'))
    print("✅ ML Models loaded successfully")
except Exception as e:
    print(f"⚠️  ML Models not loaded: {e}")
    xgb_model = scaler = label_encoders = feature_columns = None

# ─── Preprocessing helper ────────────────────────────────────
def tenure_group(t):
    if t <= 12: return '0-1_Year'
    elif t <= 24: return '1-2_Years'
    elif t <= 36: return '2-3_Years'
    elif t <= 48: return '3-4_Years'
    elif t <= 60: return '4-5_Years'
    else: return '5+_Years'

def preprocess(df: pd.DataFrame) -> pd.DataFrame:
    df['Tenure_Group'] = df['tenure'].apply(tenure_group)
    binary_cols = ['gender', 'Partner', 'Dependents', 'PhoneService', 'PaperlessBilling']
    for col in binary_cols:
        if col in label_encoders and col in df.columns:
            classes = list(label_encoders[col].classes_)
            df[col] = df[col].map(lambda s: int(label_encoders[col].transform([s])[0]) if s in classes else 0)
    multi_cols = ['MultipleLines', 'InternetService', 'OnlineSecurity', 'OnlineBackup',
                  'DeviceProtection', 'TechSupport', 'StreamingTV', 'StreamingMovies',
                  'Contract', 'PaymentMethod', 'Tenure_Group']
    cols_to_encode = [c for c in multi_cols if c in df.columns]
    df = pd.get_dummies(df, columns=cols_to_encode, drop_first=True)
    for col in feature_columns:
        if col not in df.columns:
            df[col] = 0
    return df[feature_columns]

# ─── Churn: Single Prediction ─────────────────────────────────
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
def root():
    return {"message": "Executive AI Decision Dashboard API ✅"}

@app.post("/predict-churn")
def predict_churn(customer: CustomerData):
    if not xgb_model:
        raise HTTPException(status_code=500, detail="Models not loaded")
    df = pd.DataFrame([customer.dict()])
    df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce').fillna(0)
    processed = preprocess(df)
    num_cols = ['tenure', 'MonthlyCharges', 'TotalCharges']
    processed[num_cols] = scaler.transform(processed[num_cols])
    prob = float(xgb_model.predict_proba(processed)[0][1])
    pred = int(xgb_model.predict(processed)[0])
    return {"churn_probability": prob, "is_high_risk": bool(pred), "risk_score": int(prob * 100)}

# ─── Churn: Batch CSV ─────────────────────────────────────────
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
    df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce').fillna(0)
    raw_df = df.copy()
    processed = preprocess(df)
    num_cols = ['tenure', 'MonthlyCharges', 'TotalCharges']
    processed[num_cols] = scaler.transform(processed[num_cols])
    probs = xgb_model.predict_proba(processed)[:, 1]
    raw_df['RiskScore'] = (probs * 100).astype(int)
    high_risk = raw_df[raw_df['RiskScore'] >= 60].sort_values('RiskScore', ascending=False)
    return {"high_risk_customers": high_risk.head(50).fillna("").to_dict('records'), "total_processed": len(raw_df)}

@app.get("/forecast-sales")
def forecast_sales():
    return {"status": "Not Implemented"}
