import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

print("Loading dataset...")
# Load dataset
df = pd.read_csv('../datasets/WA_Fn-UseC_-Telco-Customer-Churn.csv')

print("Preprocessing data...")
# Data cleaning
# Convert TotalCharges to numeric, coerce errors to NaN and fill with 0 (since they are usually new customers)
df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
df['TotalCharges'].fillna(0, inplace=True)

# Drop customerID as it's not a useful feature
df.drop('customerID', axis=1, inplace=True)

# Define feature types
binary_cols = ['gender', 'Partner', 'Dependents', 'PhoneService', 'PaperlessBilling', 'Churn']
multi_cols = ['MultipleLines', 'InternetService', 'OnlineSecurity', 'OnlineBackup', 
              'DeviceProtection', 'TechSupport', 'StreamingTV', 'StreamingMovies', 
              'Contract', 'PaymentMethod']

# Encode binary columns (Yes/No to 1/0)
label_encoders = {}
for col in binary_cols:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    label_encoders[col] = le

# One-hot encode multi-class categorical columns
df = pd.get_dummies(df, columns=multi_cols, drop_first=True)

# Separate features and target
X = df.drop('Churn', axis=1)
y = df['Churn']

# Save the feature columns for later use in prediction
feature_columns = X.columns.tolist()
os.makedirs('../ml_models/saved_models', exist_ok=True)
joblib.dump(feature_columns, '../ml_models/saved_models/churn_features.joblib')
joblib.dump(label_encoders, '../ml_models/saved_models/churn_label_encoders.joblib')

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Scale numerical features (tenure, MonthlyCharges, TotalCharges)
scaler = StandardScaler()
num_cols = ['tenure', 'MonthlyCharges', 'TotalCharges']
X_train[num_cols] = scaler.fit_transform(X_train[num_cols])
X_test[num_cols] = scaler.transform(X_test[num_cols])
joblib.dump(scaler, '../ml_models/saved_models/churn_scaler.joblib')

print("Training XGBoost model...")
# Train model
model = XGBClassifier(use_label_encoder=False, eval_metric='logloss', random_state=42)
model.fit(X_train, y_train)

print("Evaluating model...")
# Evaluate
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"Accuracy: {accuracy:.4f}")
print("Classification Report:")
print(classification_report(y_test, y_pred))

print("Saving model...")
# Save model
joblib.dump(model, '../ml_models/saved_models/churn_xgboost.joblib')
print("Model saved to ml_models/saved_models/churn_xgboost.joblib")
