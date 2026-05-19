# Executive AI Decision Dashboard

The **Executive AI Decision Dashboard** is a state-of-the-art AI-powered business intelligence platform designed specifically for telecom companies. It empowers executives and analysts to make data-driven, strategic decisions through machine learning and real-time analytics.

## 🚀 Key Features

*   **Customer Churn Prediction:** AI model (XGBoost + SMOTE) that scores customer risk and identifies the top targets for retention campaigns.
*   **Sales Forecasting:** Multi-model ensemble (Prophet, LSTM, ARIMA) to predict future monthly recurring revenue and pinpoint growth regions.
*   **Sentiment Monitoring:** NLP-based tracking (BERT/VADER) of customer feedback across Twitter, support tickets, and app reviews.
*   **AI Business Assistant:** A RAG-powered chat interface capable of instantly answering natural language queries about telecom KPIs and giving strategic advice.
*   **Executive Reports:** Automated PDF/PPT generator for board-ready performance summaries.

## 🛠 Tech Stack

*   **Frontend:** React.js, Vite, Tailwind CSS, Recharts, Lucide Icons
*   **Backend:** FastAPI, Python, Uvicorn, Pandas, scikit-learn
*   **Machine Learning:** XGBoost, Imbalanced-learn (SMOTE), Joblib

## 📁 Project Structure

```text
executive-ai-dashboard/
├── frontend/             # React application (UI/UX)
├── backend/              # FastAPI server (API endpoints & ML serving)
├── training_scripts/     # Python scripts for data cleaning & model training
├── ml_models/            # Serialized XGBoost models and Scalers (Ignored in Git)
├── datasets/             # Raw CSV datasets (Ignored in Git)
├── reports/              # Auto-generated PDF/Markdown reports
└── .env                  # Environment variables (Ignored in Git)
```

## ⚙️ How to Run the Project Locally

Follow these steps to get the full-stack application running on your local machine.

### 1. Prerequisites
*   Node.js (v18+)
*   Python (3.10+)

### 2. Setup the Backend (FastAPI + AI Models)
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```
3. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the FastAPI development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *The backend will now be live at `http://127.0.0.1:8000`.*

### 3. Setup the Frontend (React + Vite)
1. Open a **new** terminal window and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install the Node.js dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will now be live at `http://localhost:5173`.*

### 4. How to Train the Churn Model (Optional)
If you want to retrain the XGBoost churn model yourself:
1. Ensure you have the `WA_Fn-UseC_-Telco-Customer-Churn.csv` dataset placed inside the `datasets/` folder.
2. Navigate to the `training_scripts` folder and run the advanced script:
   ```bash
   cd training_scripts
   python train_churn_model_advanced.py
   ```
3. This will output a new model into `ml_models/saved_models/` and generate a fresh markdown report in the `reports/` folder.

## 🔒 Security Note
*   `.env`, `datasets/`, and `ml_models/saved_models/` are intentionally omitted from version control to protect sensitive API keys, large binary files, and proprietary data.
