# Sentiment Analysis Implementation Concept

This document outlines the conceptual architecture and machine learning workflow we implemented for the Telecom Executive AI Dashboard's **Customer Sentiment Monitoring** module.

## 1. The Goal
Customer support tickets, app reviews, and social media mentions (like tweets) provide a raw, unstructured firehose of customer opinions. The goal was to build a Natural Language Processing (NLP) pipeline that automatically reads text, understands its context, and mathematically categorizes it into **Positive**, **Neutral**, or **Negative** sentiment in real-time.

## 2. Data Preprocessing & Cleaning
Raw text from the internet is messy. Before a model can learn from it, we implemented a strict cleaning pipeline:
- **Noise Reduction**: Stripped out URLs, `@mentions`, and HTML tags.
- **Character Filtering**: Removed numbers, emojis, and special symbols, keeping only alphabet characters.
- **Standardization**: Lowercased everything and removed extra whitespaces.

## 3. Feature Extraction (TF-IDF)
Computers understand numbers, not words. We translated the cleaned text into a mathematical matrix using **Term Frequency-Inverse Document Frequency (TF-IDF)**.
- **Vocabulary Size**: We expanded the model's vocabulary to the top **10,000** most important word combinations.
- **N-Grams**: Instead of looking at words in isolation (e-g., "not", "good"), we configured the model to look at **Tri-grams** (chunks of up to 3 words together, e.g., "not very good"). This allows the algorithm to understand complex context and negations.
- **Stop Words**: Common filler words (like "the", "and") were filtered out so the model only focuses on words carrying actual sentiment weight.

## 4. The Machine Learning Architecture
We transitioned from a standard Logistic Regression model to a robust **Support Vector Machine (LinearSVC)**.
- **Why LinearSVC?**: SVMs are mathematically designed to find the optimal boundary (hyperplane) separating different classes in extremely high-dimensional spaces (like our 10,000 feature TF-IDF matrix). It performs exceptionally well on sparse text data.
- **Class Balancing**: Because the dataset was heavily skewed toward negative complaints (common in telecom), we applied `class_weight='balanced'`. This mathematically penalizes the model heavier if it gets a minority class (like Positive) wrong, forcing it to pay equal attention to all sentiments.
- **Probability Calibration**: SVMs natively output distance-from-boundary metrics rather than probabilities. We wrapped the model in a `CalibratedClassifierCV`, which converts these distances into the precise **Confidence Percentages** (e.g., 96% Confidence) shown on the dashboard.

## 5. Performance Gains
- **High Precision**: The final model achieved ~77.7% overall accuracy, but more importantly, it achieved a **79% precision on positive classifications**. This fixed the initial issue where positive reviews were being misclassified as neutral.

## 6. Full-Stack Integration
- **FastAPI Backend**: The trained mathematical representations (the Vectorizer and the Model) are serialized to disk (`.joblib`). On server startup, they are loaded into memory. The `/predict-sentiment` endpoint receives raw text, runs it through the exact same cleaning/vectorizing pipeline used in training, and spits out the classification in milliseconds.
- **React/Vite Frontend**: The dashboard was updated to fetch real-time analytics. We built a premium "Live Model Testing" UI using glassmorphism aesthetics, allowing executives to test the robust NLP architecture directly from their browser.
