import pandas as pd
import numpy as np
import re
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import classification_report, accuracy_score

def clean_text(text):
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'http\S+', '', text)
    text = re.sub(r'@[A-Za-z0-9_]+', '', text)
    text = re.sub(r'[^a-z\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

print("=== Starting AI Support Auto-Triage Training Pipeline ===")

# 1. Load Data
dataset_path = "datasets/customer_support_tickets.csv"
print(f"Loading dataset from: {dataset_path}...")
df = pd.read_csv(dataset_path)

# Drop rows missing crucial info
df = df.dropna(subset=['Ticket Description', 'Ticket Type', 'Ticket Priority'])

# Combine Subject and Description for maximum context
df['Full_Text'] = df['Ticket Subject'].fillna('') + " " + df['Ticket Description']

print("Preprocessing text data...")
df['Cleaned_Text'] = df['Full_Text'].apply(clean_text)

# We want only valid text rows
df = df[df['Cleaned_Text'].str.len() > 5]

X = df['Cleaned_Text']
y_type = df['Ticket Type']
y_priority = df['Ticket Priority']

# Train-Test Split (using the same split for both models to simplify)
X_train, X_test, yt_train, yt_test, yp_train, yp_test = train_test_split(
    X, y_type, y_priority, test_size=0.2, random_state=42
)

print(f"Training set size: {len(X_train)}")
print(f"Test set size: {len(X_test)}")

# 2. Vectorization
print("Vectorizing text using TF-IDF (10000 features, 1-3 ngrams)...")
vectorizer = TfidfVectorizer(max_features=10000, stop_words='english', ngram_range=(1, 3), min_df=2)
X_train_tfidf = vectorizer.fit_transform(X_train)
X_test_tfidf = vectorizer.transform(X_test)

# 3. Train Ticket Type Classifier
print("\nTraining Ticket Type Classifier (LinearSVC)...")
type_base_model = LinearSVC(class_weight='balanced', C=0.5, max_iter=2000, random_state=42)
type_model = CalibratedClassifierCV(type_base_model, cv=5)
type_model.fit(X_train_tfidf, yt_train)

print("\n--- Ticket Type Model Evaluation ---")
yt_pred = type_model.predict(X_test_tfidf)
print(f"Type Accuracy: {accuracy_score(yt_test, yt_pred) * 100:.2f}%")
print(classification_report(yt_test, yt_pred))

# 4. Train Ticket Priority Classifier
print("\nTraining Ticket Priority Classifier (LinearSVC)...")
priority_base_model = LinearSVC(class_weight='balanced', C=0.5, max_iter=2000, random_state=42)
priority_model = CalibratedClassifierCV(priority_base_model, cv=5)
priority_model.fit(X_train_tfidf, yp_train)

print("\n--- Ticket Priority Model Evaluation ---")
yp_pred = priority_model.predict(X_test_tfidf)
print(f"Priority Accuracy: {accuracy_score(yp_test, yp_pred) * 100:.2f}%")
print(classification_report(yp_test, yp_pred))

# 5. Serialize Models
output_dir = "ml_models/saved_models"
os.makedirs(output_dir, exist_ok=True)

joblib.dump(vectorizer, os.path.join(output_dir, "triage_vectorizer.joblib"))
joblib.dump(type_model, os.path.join(output_dir, "triage_type_model.joblib"))
joblib.dump(priority_model, os.path.join(output_dir, "triage_priority_model.joblib"))

print(f"\nModels and Vectorizer successfully saved to: {output_dir}")
print("=== Support Triage Training Pipeline Completed Successfully ===")
