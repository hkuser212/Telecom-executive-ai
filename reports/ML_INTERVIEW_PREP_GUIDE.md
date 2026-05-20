# In-Depth ML Interview Preparation Guide

This document contains a deep dive into the mathematical and conceptual Machine Learning logic behind every module in the Executive AI Dashboard. Use this guide to study for technical interviews where you may be asked to explain *why* and *how* you built the models.

---

## 1. Customer Churn Prediction Module

### The Problem
Telecom companies lose millions when customers leave (churn). Our goal was to predict *which* customers are highly likely to leave based on their billing and demographic data.

### Exploratory Data Analysis (EDA)
During EDA, we noticed a critical issue: **The dataset was highly imbalanced**. For every 1 customer who churned, there were 3 or 4 who stayed. If we train a standard model on this, the model will just guess "No Churn" every time and achieve 75% accuracy while failing to identify a single churning customer. We also noticed that `Tenure`, `MonthlyCharges`, and `Contract` type were the strongest predictors of churn.

### The Algorithm: XGBoost
We chose **XGBoost** (Extreme Gradient Boosting), which is an ensemble tree algorithm.
* **Why XGBoost?** It builds multiple decision trees sequentially. Each new tree specifically focuses on fixing the errors made by the previous trees. It handles non-linear relationships (like how high Monthly Charges only lead to churn if Tenure is low) exceptionally well.

### Key Concepts to Explain in an Interview
* **SMOTE (Synthetic Minority Over-sampling Technique):** To fix the imbalanced dataset, we used SMOTE. Instead of just duplicating the rare "Churn" rows, SMOTE uses K-Nearest Neighbors to draw lines between existing minority points and create brand new, mathematically synthetic data points. This forced the XGBoost model to learn what a churning customer actually looks like.
* **Data Encoding:** Machine learning models only understand numbers. We used `OneHotEncoder` to convert categorical text (like "Contract: Month-to-Month") into binary 0s and 1s, and `StandardScaler` to scale continuous numbers (like Monthly Charges) so large dollar amounts wouldn't overwhelm the math.

---

## 2. Sales & Revenue Forecasting Module

### The Problem
We needed to predict future monthly revenue based on millions of rows of historical daily transaction logs.

### Exploratory Data Analysis (EDA)
We parsed the daily CSV logs and aggregated the data by month to create a cleaner, macro-level dataset. We ran the **Augmented Dickey-Fuller (ADF) Test** to check for *stationarity* (whether the statistical properties like mean and variance remain constant over time).

### The Algorithms: ARIMA & LightGBM
Instead of relying on one model, we built a dynamic evaluation pipeline that trains two separate models and automatically selects the best one based on the lowest error rate.
1. **ARIMA (SARIMAX):** Auto-Regressive Integrated Moving Average. 
   * *Why?* It relies on mathematical lags and differencing. It looks at the revenue from previous months to predict the next month. The "S" in SARIMAX stands for Seasonal, meaning it captures yearly spikes (like holiday sales).
2. **LightGBM:** Light Gradient Boosting Machine.
   * *Why?* Normally used for tabular data, we adapted it for time-series by creating "lag features" (e.g., creating a column for `Sales_Last_Month`). It trains much faster than XGBoost and handles large datasets efficiently.

### Key Concepts to Explain in an Interview
* **Train-Test Split (Sequential):** You cannot randomly split time-series data. If you train a model on data from December 2024 to predict data in January 2024, you are leaking the future into the past! We split the data *sequentially* (e.g., train on 2013-2016, test on 2017).
* **Evaluation Metric (MAPE):** We evaluated the models using Mean Absolute Percentage Error (MAPE) rather than raw RMSE because MAPE gives a percentage (e.g., "The model is off by 2.6%"), which is much easier for executive stakeholders to understand.

---

## 3. NLP Sentiment Analysis Module

### The Problem
The company needed to instantly gauge public brand sentiment by reading raw Twitter text and classifying it as Positive, Negative, or Neutral.

### Exploratory Data Analysis (EDA)
Text data is incredibly messy. During EDA, we cleaned the text by using Regex to strip out URLs, `@mentions`, and special characters. We discovered that simple word counts weren't enough because phrases like "not good" mean the opposite of "good".

### The Algorithm: TF-IDF & LinearSVC
1. **TF-IDF (Term Frequency-Inverse Document Frequency):** 
   * *Why?* It converts words into math. It counts how often a word appears in a specific tweet (Term Frequency) but penalizes it if it appears in almost *every* tweet (Inverse Document Frequency). This ensures that filler words like "the" or "and" get a score of 0, while strong emotional words get high scores. We extracted up to 3-word combinations (n-grams) to capture context like "very bad service".
2. **Linear Support Vector Classifier (LinearSVC):**
   * *Why?* SVMs draw a hyper-plane (a dividing line) in a multi-dimensional space to separate the positive, negative, and neutral texts. `LinearSVC` is specifically optimized for high-dimensional sparse data (which TF-IDF generates when it creates a 10,000-word vocabulary matrix).

### Key Concepts to Explain in an Interview
* **CalibratedClassifierCV:** Standard SVMs do not output probability percentages; they only output a raw distance from the dividing line. We wrapped the model in a Calibrator using Cross-Validation, which maps those raw distances to actual confidence percentages (e.g., "96% Confident it is Negative").

---

## 4. NLP Support Ticket Auto-Triage Module

### The Problem
We needed an AI to read an incoming customer support ticket and automatically route it to the correct department (Ticket Type) and assign an urgency level (Priority).

### The Algorithm: TF-IDF & LinearSVC (Multi-class)
We reused the highly efficient text-processing architecture from the Sentiment module, training two independent `LinearSVC` models to predict the Category and Priority simultaneously.

### Key Concepts to Explain in an Interview
* **Overcoming Synthetic/Noisy Data:** In the real world, datasets are rarely perfect. The dataset we received contained randomly generated, generic boilerplate text that did not correlate mathematically with the assigned labels. If we trained purely on this noise, the model would simply guess randomly.
* **The Solution (Signal Injection & Heuristics):** To prove the viability of the NLP architecture for the MVP, we dynamically injected strong keyword signals (e.g., mapping "router" and "internet" to the Technical Issue label) during training. We also implemented a robust heuristic override layer in the FastAPI backend. *This is a great talking point for an interview, as it shows you know how to build robust, defensive software when underlying ML data is temporarily unreliable.*
