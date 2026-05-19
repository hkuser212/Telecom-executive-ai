# Sales Forecasting Model Performance Report
**Date Generated:** 2026-05-20 00:49:28

## Executive Summary
This report details the advanced EDA and performance of the multi-model ensemble (Prophet, ARIMA, LightGBM) trained on the Store Item Demand dataset (`train.csv`).
To align with the Telecom Executive Dashboard, daily item sales records (~913,000 rows) were aggregated into a monthly time series (60 months, 2013-2017) and scaled to match actual business revenues (₹ Billions).

## Advanced Exploratory Data Analysis (EDA)
- **Total Records Processed:** 913,000 daily sales rows
- **Store Outlets:** 10 distinct physical locations
- **Catalog Items:** 50 items tracked across all stores
- **Temporal Range:** 2013-01-01 to 2017-12-31 (5 Full Years)
- **Missing Values:** 0

### Stationarity & Seasonality Insights
- We applied the **Augmented Dickey-Fuller (ADF) Test** to test for stationarity:
  - **Daily Sales ADF Statistic:** -3.0602 (p-value: 2.9639e-02)
  - **Monthly Aggregated ADF Statistic:** -5.2475 (p-value: 0.0000)
  - *Interpretation:* The daily series shows strong stationarity because of regular intra-week seasonal drops. However, the monthly series exhibits a strong linear upward growth trend combined with a prominent annual seasonal peak during June/July.

## Model Evaluation (Validation Set: 2017)
We evaluated the models on the final 12 months of the historical series (Jan-Dec 2017) to select the best predictor:

| Model | Mean Absolute Percentage Error (MAPE) | Root Mean Squared Error (RMSE) |
|---|---|---|
| **Prophet** | 4.09% | 0.1328 |
| **ARIMA (SARIMAX)** | 2.60% | 0.0834 |
| **LightGBM Regressor** | 14.48% | 0.5304 |

**🏆 Champion Model:** ARIMA (MAPE: 2.60%)

## Projections & Business Action Plan
- The ensemble predicts a continued **upward growth trend in Q4**, forecasting overall revenues to exceed **₹4.3B**.
- LightGBM, utilizing auto-regressive lags, indicates that strong Q2/Q3 performance is the single largest lag-predictor of year-end demand, suggesting that sales campaigns in late summer are vital.
