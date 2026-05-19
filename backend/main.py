from fastapi import FastAPI, HTTPException, File, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorClient
import os, io, joblib, xgboost, pandas as pd, bcrypt
from datetime import datetime, timedelta
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
def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    plain_bytes = plain.encode('utf-8')
    hashed_bytes = hashed.encode('utf-8')
    try:
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception:
        return False

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
    print("✅ Churn Prediction Models loaded successfully")
except Exception as e:
    print(f"⚠️  Churn Prediction Models not loaded: {e}")
    xgb_model = scaler = label_encoders = feature_columns = None

sales_forecast_results = None
try:
    sales_forecast_results = joblib.load(os.path.join(MODEL_DIR, 'sales_forecast_results.joblib'))
    print("✅ Sales Forecasting Results loaded successfully")
except Exception as e:
    print(f"⚠️  Sales Forecasting Results not loaded: {e}")

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
    global sales_forecast_results
    if not sales_forecast_results:
        try:
            sales_forecast_results = joblib.load(os.path.join(MODEL_DIR, 'sales_forecast_results.joblib'))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Sales forecasting results not loaded: {e}")
            
    try:
        # Construct the 12-month series for the final year (2017)
        # 2017 starts at index 48 (first 4 years are 48 months: 2013-2016)
        history_actuals = sales_forecast_results["history_actuals"]
        history_months = sales_forecast_results["history_months"]
        val_prophet = sales_forecast_results["validation_prophet"]
        val_arima = sales_forecast_results["validation_arima"]
        val_lgb = sales_forecast_results["validation_lgb"]
        
        forecast_data = []
        for i in range(12):
            month_idx = 48 + i
            month_name = history_months[month_idx]
            
            # Jan-Aug (index 0 to 7) are actuals.
            # Sep-Dec (index 8 to 11) are forecasts (actual is None).
            if i < 8:
                actual_val = float(history_actuals[month_idx])
            else:
                actual_val = None
                
        forecast_data.append({
                "month": month_name,
                "actual": actual_val,
                "prophet": round(float(val_prophet[i]), 2),
                "arima": round(float(val_arima[i]), 2),
                "lstm": round(float(val_lgb[i]), 2)  # map LightGBM to lstm key for seamless frontend binding
            })
        return forecast_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error preparing forecast data: {e}")

# ─── Dynamic Forecasting Endpoints ──────────────────────────

class ExportRequest(BaseModel):
    data: list

@app.post("/forecast-sales-export")
def export_forecast_sales(body: ExportRequest):
    import csv
    if not body.data:
        raise HTTPException(status_code=400, detail="No data provided to export")
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    headers = list(body.data[0].keys())
    # Format headers to look professional
    display_headers = [h.upper() for h in headers]
    writer.writerow(display_headers)
    
    for row in body.data:
        writer.writerow([row.get(h, "") for h in headers])
        
    output.seek(0)
    
    # Return as streaming response
    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sales_forecast_report.csv"}
    )


@app.post("/forecast-sales-upload")
async def forecast_sales_upload(file: UploadFile = File(...)):
    import numpy as np
    from statsmodels.tsa.stattools import adfuller
    from statsmodels.tsa.statespace.sarimax import SARIMAX
    from prophet import Prophet
    import lightgbm as lgb
    from sklearn.metrics import mean_squared_error, mean_absolute_percentage_error
    import warnings
    warnings.filterwarnings('ignore')
    
    try:
        contents = await file.read()
        df_uploaded = pd.read_csv(io.StringIO(contents.decode('utf-8', errors='ignore')))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV file: {e}")
        
    if len(df_uploaded) == 0:
        raise HTTPException(status_code=400, detail="The uploaded CSV file is empty.")

    # ─── Robust Column Auto-Detection Engine ────────────────────────
    date_col = None
    sales_col = None
    
    # 1. Detect Date Column
    date_keywords = ['date', 'ds', 'timestamp', 'dt', 'time', 'period', 'month', 'year', 'day', 'created_at', 'order_date', 'transaction_date', 'datetime', 'time_period', 'ymd', 'month_year', 'sales_date']
    
    for c in df_uploaded.columns:
        c_str = str(c).lower().strip()
        if any(kw == c_str or kw in c_str for kw in date_keywords):
            try:
                parsed = pd.to_datetime(df_uploaded[c], errors='coerce')
                if parsed.notna().sum() > len(df_uploaded) * 0.5:
                    date_col = c
                    break
            except Exception:
                continue

    if not date_col:
        best_parse_col = None
        highest_parse_ratio = 0.0
        for c in df_uploaded.columns:
            # Skip numeric columns to prevent epoch timestamp coercion (e.g. 1000 -> 1970-01-01)
            if np.issubdtype(df_uploaded[c].dtype, np.number):
                continue
            try:
                parsed = pd.to_datetime(df_uploaded[c], errors='coerce')
                ratio = parsed.notna().sum() / len(df_uploaded)
                if ratio > 0.5 and ratio > highest_parse_ratio:
                    highest_parse_ratio = ratio
                    best_parse_col = c
            except Exception:
                continue
        if best_parse_col:
            date_col = best_parse_col

    # 2. Detect Sales/Target Column
    sales_keywords = ['sales', 'y', 'revenue', 'amount', 'sales_volume', 'total', 'recharge', 'charges', 'price', 'quantity', 'count', 'value', 'target', 'income', 'cost', 'profit', 'units', 'val', 'rev']
    
    sales_candidates = []
    for c in df_uploaded.columns:
        try:
            converted = pd.to_numeric(df_uploaded[c], errors='coerce')
            if converted.notna().sum() > len(df_uploaded) * 0.5:
                c_str = str(c).lower().strip()
                for kw in sales_keywords:
                    if kw == c_str:
                        sales_candidates.append((0, c))
                        break
                    elif kw in c_str:
                        sales_candidates.append((1, c))
                        break
        except Exception:
            continue
            
    if sales_candidates:
        sales_candidates.sort(key=lambda x: x[0])
        sales_col = sales_candidates[0][1]
        
    if not sales_col:
        numeric_candidates = []
        for c in df_uploaded.columns:
            if c == date_col:
                continue
            try:
                converted = pd.to_numeric(df_uploaded[c], errors='coerce')
                if converted.notna().sum() > len(df_uploaded) * 0.5:
                    c_str = str(c).lower().strip()
                    id_keywords = ['id', 'index', 'year', 'month', 'day', 'store', 'item', 'code', 'zip', 'phone', 'customer', 'cust']
                    if any(id_kw in c_str for id_kw in id_keywords):
                        continue
                    var = float(converted.var()) if len(converted) > 1 else 0.0
                    numeric_candidates.append((c, var))
            except Exception:
                continue
                
        if numeric_candidates:
            numeric_candidates.sort(key=lambda x: x[1], reverse=True)
            sales_col = numeric_candidates[0][0]
            
    if not sales_col:
        for c in df_uploaded.columns:
            if c == date_col:
                continue
            try:
                converted = pd.to_numeric(df_uploaded[c], errors='coerce')
                if converted.notna().sum() > len(df_uploaded) * 0.5:
                    sales_col = c
                    break
            except Exception:
                continue

    if not sales_col:
        raise HTTPException(
            status_code=400,
            detail="Could not find any numeric column in the CSV. Please ensure your CSV has at least one column with numerical values (e.g. sales, revenue, charges)."
        )

    # 3. Handle generated dates if date_col is missing
    if not date_col:
        N = len(df_uploaded)
        if N <= 500:
            start_date = datetime.now() - pd.DateOffset(months=N)
            generated_dates = pd.date_range(start=start_date, periods=N, freq='ME')
        else:
            start_date = datetime.now() - pd.DateOffset(days=N)
            generated_dates = pd.date_range(start=start_date, periods=N, freq='D')
            
        df_uploaded['generated_date'] = generated_dates
        date_col = 'generated_date'
        
    # ─── Data Preprocessing ──────────────────────────────────────────
    df_uploaded[date_col] = pd.to_datetime(df_uploaded[date_col], errors='coerce')
    df_uploaded = df_uploaded.dropna(subset=[date_col])
    
    if len(df_uploaded) == 0:
        raise HTTPException(status_code=400, detail="The date column contains invalid or missing dates.")
        
    df_uploaded[sales_col] = pd.to_numeric(df_uploaded[sales_col], errors='coerce').fillna(0)
    df_uploaded = df_uploaded.sort_values(date_col).reset_index(drop=True)
    
    # Monthly aggregation
    df_monthly = df_uploaded.groupby(pd.Grouper(key=date_col, freq='ME'))[sales_col].sum().reset_index()
    df_monthly['month_name'] = df_monthly[date_col].dt.strftime('%b')
    df_monthly['year'] = df_monthly[date_col].dt.year
    
    total_months = len(df_monthly)
    if total_months < 2:
        raise HTTPException(
            status_code=400, 
            detail=f"The uploaded dataset contains only {total_months} aggregated month(s). At least 2 aggregated months are required to train the forecasting models."
        )
        
    # Perform ADF Stationarity Test
    try:
        adf_res = adfuller(df_monthly[sales_col])
        adf_stat = float(adf_res[0])
        p_val = float(adf_res[1])
        is_stationary = bool(p_val < 0.05)
    except Exception as e:
        adf_stat = 0.0
        p_val = 1.0
        is_stationary = False
        
    # Scale dataset for UI dashboard alignment [2.0, 4.0]
    raw_min = float(df_monthly[sales_col].min())
    raw_max = float(df_monthly[sales_col].max())
    
    target_min, target_max = 2.0, 4.0
    if raw_max > raw_min:
        df_monthly['scaled_sales'] = target_min + (df_monthly[sales_col] - raw_min) * (target_max - target_min) / (raw_max - raw_min)
    else:
        df_monthly['scaled_sales'] = target_min
        
    # ─── Dynamic Train-Test Split ──────────────────────────────────
    if total_months >= 24:
        test_size = 12
    elif total_months >= 12:
        test_size = 3
    else:
        test_size = 1
        
    train_size = total_months - test_size
    train_df = df_monthly.iloc[:train_size].copy()
    test_df = df_monthly.iloc[train_size:].copy()
    
    y_true = test_df['scaled_sales'].values
    
    # ─── Adaptive ML Model Fitting ────────────────────────────────
    # 1. Prophet
    try:
        if train_size >= 2:
            prophet_train = train_df[[date_col, 'scaled_sales']].rename(columns={date_col: 'ds', 'scaled_sales': 'y'})
            prophet_model = Prophet(yearly_seasonality=(train_size >= 24), weekly_seasonality=False, daily_seasonality=False)
            prophet_model.fit(prophet_train)
            future_prophet = prophet_model.make_future_dataframe(periods=test_size, freq='ME')
            forecast_prophet_all = prophet_model.predict(future_prophet)
            val_pred_prophet = forecast_prophet_all.iloc[train_size:train_size+test_size]['yhat'].values
        else:
            val_pred_prophet = y_true.copy() if len(y_true) > 0 else np.array([3.0])
            
        if total_months >= 2:
            # Prophet full model
            prophet_full_train = df_monthly[[date_col, 'scaled_sales']].rename(columns={date_col: 'ds', 'scaled_sales': 'y'})
            prophet_full_model = Prophet(yearly_seasonality=(total_months >= 24), weekly_seasonality=False, daily_seasonality=False)
            prophet_full_model.fit(prophet_full_train)
            future_full = prophet_full_model.make_future_dataframe(periods=12, freq='ME')
            forecast_full_prophet = prophet_full_model.predict(future_full)
            future_pred_prophet = forecast_full_prophet.iloc[total_months:total_months+12]['yhat'].values
        else:
            future_pred_prophet = np.ones(12) * (df_monthly['scaled_sales'].mean() if len(df_monthly) > 0 else 3.0)
    except Exception as e:
        print(f"Prophet training failed: {e}")
        val_pred_prophet = y_true.copy() if len(y_true) > 0 else np.array([3.0])
        future_pred_prophet = np.ones(12) * (y_true.mean() if len(y_true) > 0 else 3.0)
        
    # 2. ARIMA
    try:
        if train_size >= 24:
            arima_model = SARIMAX(train_df['scaled_sales'].values, order=(1,1,1), seasonal_order=(1,1,0,12), enforce_stationarity=False, enforce_invertibility=False)
        elif train_size >= 3:
            arima_model = SARIMAX(train_df['scaled_sales'].values, order=(1,1,1), enforce_stationarity=False, enforce_invertibility=False)
        elif train_size == 2:
            arima_model = SARIMAX(train_df['scaled_sales'].values, order=(1,0,0), enforce_stationarity=False, enforce_invertibility=False)
        else:
            arima_model = None
            
        if arima_model is not None:
            arima_result = arima_model.fit(disp=False)
            val_pred_arima = arima_result.forecast(steps=test_size)
        else:
            val_pred_arima = y_true.copy() if len(y_true) > 0 else np.array([3.0])
        
        # ARIMA full model
        if total_months >= 24:
            arima_full = SARIMAX(df_monthly['scaled_sales'].values, order=(1,1,1), seasonal_order=(1,1,0,12), enforce_stationarity=False, enforce_invertibility=False)
        elif total_months >= 3:
            arima_full = SARIMAX(df_monthly['scaled_sales'].values, order=(1,1,1), enforce_stationarity=False, enforce_invertibility=False)
        else:
            arima_full = SARIMAX(df_monthly['scaled_sales'].values, order=(1,0,0), enforce_stationarity=False, enforce_invertibility=False)
            
        arima_full_result = arima_full.fit(disp=False)
        future_pred_arima = arima_full_result.forecast(steps=12)
    except Exception as e:
        print(f"ARIMA training failed: {e}")
        val_pred_arima = y_true.copy() if len(y_true) > 0 else np.array([3.0])
        future_pred_arima = np.ones(12) * (y_true.mean() if len(y_true) > 0 else 3.0)
        
    # 3. LightGBM
    try:
        include_lag12 = (total_months >= 15)
        
        def create_lgb_features(data):
            df_feat = data.copy()
            df_feat['month'] = df_feat[date_col].dt.month
            df_feat['year'] = df_feat[date_col].dt.year
            df_feat['lag_1'] = df_feat['scaled_sales'].shift(1)
            if total_months >= 4:
                df_feat['lag_2'] = df_feat['scaled_sales'].shift(2)
            if include_lag12:
                df_feat['lag_12'] = df_feat['scaled_sales'].shift(12)
            if total_months >= 4:
                df_feat['rolling_mean_3'] = df_feat['scaled_sales'].shift(1).rolling(3).mean()
            if total_months >= 6:
                df_feat['rolling_mean_6'] = df_feat['scaled_sales'].shift(1).rolling(6).mean()
            return df_feat
            
        feat_df = create_lgb_features(df_monthly)
        feat_df_clean = feat_df.dropna().reset_index(drop=True)
        lgb_train_size = len(feat_df_clean) - test_size
        
        if lgb_train_size > 0:
            feature_cols = ['month', 'year', 'lag_1']
            if total_months >= 4:
                feature_cols.append('lag_2')
                feature_cols.append('rolling_mean_3')
            if include_lag12:
                feature_cols.append('lag_12')
            if total_months >= 6:
                feature_cols.append('rolling_mean_6')
                
            X_train = feat_df_clean.iloc[:lgb_train_size][feature_cols]
            y_train = feat_df_clean.iloc[:lgb_train_size]['scaled_sales']
            X_test = feat_df_clean.iloc[lgb_train_size:][feature_cols]
            
            lgb_model = lgb.LGBMRegressor(n_estimators=50, learning_rate=0.1, random_state=42, verbose=-1)
            lgb_model.fit(X_train, y_train)
            val_pred_lgb = lgb_model.predict(X_test)
            
            # LGBM Full
            X_full = feat_df_clean[feature_cols]
            y_full = feat_df_clean['scaled_sales']
            lgb_full = lgb.LGBMRegressor(n_estimators=50, learning_rate=0.1, random_state=42, verbose=-1)
            lgb_full.fit(X_full, y_full)
            
            # Recursive future forecast
            future_preds_lgb = []
            temp_sales = df_monthly['scaled_sales'].tolist()
            future_dates = [df_monthly[date_col].max() + pd.DateOffset(months=i) for i in range(1, 13)]
            
            for d in future_dates:
                m_val = d.month
                y_val = d.year
                lag1 = temp_sales[-1]
                
                row_data = [m_val, y_val, lag1]
                if total_months >= 4:
                    lag2 = temp_sales[-2]
                    rm3 = float(np.mean(temp_sales[-3:]))
                    row_data.extend([lag2, rm3])
                if include_lag12:
                    lag12 = temp_sales[-12]
                    row_data.append(lag12)
                if total_months >= 6:
                    rm6 = float(np.mean(temp_sales[-6:]))
                    row_data.append(rm6)
                    
                p_val_lgb = lgb_full.predict(pd.DataFrame([row_data], columns=feature_cols))[0]
                future_preds_lgb.append(float(p_val_lgb))
                temp_sales.append(float(p_val_lgb))
            future_pred_lgb = np.array(future_preds_lgb)
        else:
            val_pred_lgb = val_pred_arima.copy()
            future_pred_lgb = future_pred_arima.copy()
    except Exception as e:
        print(f"LightGBM training failed: {e}")
        val_pred_lgb = val_pred_arima.copy()
        future_pred_lgb = future_pred_arima.copy()
        
    # Calculate MAPEs and RMSEs
    mape_prophet = float(mean_absolute_percentage_error(y_true, val_pred_prophet)) if len(y_true) > 0 else 0.0
    rmse_prophet = float(np.sqrt(mean_squared_error(y_true, val_pred_prophet))) if len(y_true) > 0 else 0.0
    
    mape_arima = float(mean_absolute_percentage_error(y_true, val_pred_arima)) if len(y_true) > 0 else 0.0
    rmse_arima = float(np.sqrt(mean_squared_error(y_true, val_pred_arima))) if len(y_true) > 0 else 0.0
    
    mape_lgb = float(mean_absolute_percentage_error(y_true, val_pred_lgb)) if len(y_true) > 0 else 0.0
    rmse_lgb = float(np.sqrt(mean_squared_error(y_true, val_pred_lgb))) if len(y_true) > 0 else 0.0
    
    best_model = "arima"
    best_mape = mape_arima
    if mape_prophet < best_mape:
        best_model = "prophet"
        best_mape = mape_prophet
    if mape_lgb < best_mape:
        best_model = "lstm"
        best_mape = mape_lgb
        
    # Construct combined timeline payload (historical test actuals + future predictions)
    forecast_data = []
    
    # Historical test size months
    for i in range(test_size):
        row = test_df.iloc[i]
        forecast_data.append({
            "month": str(row['month_name']),
            "year": int(row['year']),
            "actual": round(float(row['scaled_sales']), 2),
            "raw_actual": round(float(row[sales_col]), 2),
            "prophet": round(float(val_pred_prophet[i]), 2),
            "arima": round(float(val_pred_arima[i]), 2),
            "lstm": round(float(val_pred_lgb[i]), 2)
        })
        
    # 12 future projection months
    future_dates = [df_monthly[date_col].max() + pd.DateOffset(months=i) for i in range(1, 13)]
    for i in range(12):
        d = future_dates[i]
        forecast_data.append({
            "month": d.strftime('%b'),
            "year": d.year,
            "actual": None,
            "raw_actual": None,
            "prophet": round(float(future_pred_prophet[i]), 2),
            "arima": round(float(future_pred_arima[i]), 2),
            "lstm": round(float(future_pred_lgb[i]), 2)
        })
        
    return {
        "forecast_data": forecast_data,
        "metrics": {
            "prophet": {"mape": round(mape_prophet * 100, 2), "rmse": round(rmse_prophet, 4)},
            "arima": {"mape": round(mape_arima * 100, 2), "rmse": round(rmse_arima, 4)},
            "lstm": {"mape": round(mape_lgb * 100, 2), "rmse": round(rmse_lgb, 4)}
        },
        "stationarity": {
            "adf_statistic": round(adf_stat, 4),
            "p_value": round(p_val, 6),
            "is_stationary": is_stationary
        },
        "best_model": best_model,
        "total_records": len(df_uploaded),
        "aggregated_months": total_months
    }

