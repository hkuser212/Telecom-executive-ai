import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

print("Starting Exploratory Data Analysis (EDA)...")

# Load dataset
df = pd.read_csv('../datasets/WA_Fn-UseC_-Telco-Customer-Churn.csv')

# Clean data
df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
df['TotalCharges'].fillna(0, inplace=True)
df.drop('customerID', axis=1, inplace=True)

# Generate statistics
total_customers = len(df)
churn_rate = (df['Churn'] == 'Yes').mean() * 100

report_md = f"# Exploratory Data Analysis (EDA) Report\n\n"
report_md += f"**Total Customers:** {total_customers}\n"
report_md += f"**Overall Churn Rate:** {churn_rate:.2f}%\n\n"

report_md += "## Summary Statistics for Numerical Columns\n"
report_md += "```text\n"
report_md += df[['tenure', 'MonthlyCharges', 'TotalCharges']].describe().to_string()
report_md += "\n```\n\n"

report_md += "## Categorical Insights\n"
categorical_cols = ['gender', 'SeniorCitizen', 'Partner', 'Dependents', 'Contract', 'PaymentMethod']

for col in categorical_cols:
    churn_by_cat = df.groupby(col)['Churn'].value_counts(normalize=True).unstack() * 100
    report_md += f"### Churn by {col}\n"
    report_md += "```text\n"
    report_md += churn_by_cat.to_string()
    report_md += "\n```\n\n"

# Ensure reports directory exists
os.makedirs('../reports', exist_ok=True)

# Save report
with open('../reports/eda_report.md', 'w') as f:
    f.write(report_md)

print("EDA completed and saved to reports/eda_report.md")
