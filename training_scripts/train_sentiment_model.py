import pandas as pd
import numpy as np
import os
import joblib
import re
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

print("=== Starting NLP Sentiment Model Training Pipeline ===")

# 1. Load Dataset
dataset_path = "../datasets/Tweets.csv"
if not os.path.exists(dataset_path):
    dataset_path = "datasets/Tweets.csv"

print(f"Loading dataset from: {dataset_path}...")
df = pd.read_csv(dataset_path)

# 2. Text Preprocessing
print("Preprocessing text data...")

def clean_text(text):
    if not isinstance(text, str):
        return ""
    text = text.lower()
    # Remove URLs
    text = re.sub(r'http\S+|www\.\S+', '', text)
    # Remove HTML tags
    text = re.sub(r'<.*?>', '', text)
    # Remove mentions
    text = re.sub(r'@\w+', '', text)
    # Remove special characters and numbers
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    # Remove extra spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

df['clean_text'] = df['text'].apply(clean_text)

# 3. Prepare Data for Training
X = df['clean_text']
y = df['airline_sentiment'] # 'negative', 'neutral', 'positive'

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

print(f"Training set size: {len(X_train)}")
print(f"Test set size: {len(X_test)}")

from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV

# 4. Feature Extraction (TF-IDF)
print("Vectorizing text using TF-IDF...")
# Increased max_features and added tri-grams for better context capture
vectorizer = TfidfVectorizer(max_features=10000, stop_words='english', ngram_range=(1, 3), min_df=2)
X_train_tfidf = vectorizer.fit_transform(X_train)
X_test_tfidf = vectorizer.transform(X_test)

# 5. Model Training (LinearSVC with Calibration)
print("Training LinearSVC classifier...")
# LinearSVC usually outperforms LogisticRegression on TF-IDF text features
base_model = LinearSVC(class_weight='balanced', C=0.5, max_iter=2000, random_state=42)
model = CalibratedClassifierCV(base_model, cv=5)
model.fit(X_train_tfidf, y_train)

# 6. Evaluation
print("\n--- Model Evaluation ---")
y_pred = model.predict(X_test_tfidf)
acc = accuracy_score(y_test, y_pred)
print(f"Accuracy: {acc * 100:.2f}%")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# 7. Serialize Model and Vectorizer
output_dir = "ml_models/saved_models"
if not os.path.exists(output_dir):
    os.makedirs(output_dir, exist_ok=True)

joblib.dump(model, os.path.join(output_dir, "sentiment_model.joblib"))
joblib.dump(vectorizer, os.path.join(output_dir, "sentiment_vectorizer.joblib"))

print(f"\nModel and Vectorizer successfully saved to: {output_dir}")
print("=== Sentiment Training Pipeline Completed Successfully ===")
