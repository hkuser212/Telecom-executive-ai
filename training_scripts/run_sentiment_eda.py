import pandas as pd
import os
import matplotlib.pyplot as plt
import re

print("=== Starting Sentiment Analysis EDA ===")

# Load Dataset
dataset_path = "../datasets/Tweets.csv"
if not os.path.exists(dataset_path):
    dataset_path = "datasets/Tweets.csv"
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset not found at: {dataset_path}")

print(f"Loading dataset from: {dataset_path}...")
df = pd.read_csv(dataset_path)

print(f"Dataset shape: {df.shape}")
print(f"Columns: {df.columns.tolist()}")

# Basic Cleaning Stats
total_tweets = len(df)
missing_values = df.isnull().sum()

# Distribution of sentiments
sentiment_counts = df['airline_sentiment'].value_counts()
sentiment_percentages = df['airline_sentiment'].value_counts(normalize=True) * 100

# Basic Text Analysis
def clean_text_basic(text):
    text = re.sub(r'http\S+', '', text) # Remove URLs
    text = re.sub(r'@\w+', '', text) # Remove mentions
    text = re.sub(r'#', '', text) # Remove hashtag symbol
    return text.strip()

df['clean_text'] = df['text'].apply(clean_text_basic)
df['word_count'] = df['clean_text'].apply(lambda x: len(str(x).split()))

avg_word_count = df['word_count'].mean()

# Topic/Airline distribution
airline_counts = df['airline'].value_counts()

print("\n--- EDA Insights ---")
print(f"Total Tweets: {total_tweets}")
print(f"Sentiment Distribution:\n{sentiment_counts}")
print(f"Average Word Count (after basic cleaning): {avg_word_count:.2f}")

# Generate Report
reports_dir = "../reports"
os.makedirs(reports_dir, exist_ok=True)

report_content = f"""# Sentiment Analysis EDA Report

## Dataset Overview
- **Total Tweets:** {total_tweets}
- **Columns Available:** {', '.join(df.columns.tolist())}

## Sentiment Distribution
- **Negative:** {sentiment_counts.get('negative', 0)} ({sentiment_percentages.get('negative', 0):.2f}%)
- **Neutral:** {sentiment_counts.get('neutral', 0)} ({sentiment_percentages.get('neutral', 0):.2f}%)
- **Positive:** {sentiment_counts.get('positive', 0)} ({sentiment_percentages.get('positive', 0):.2f}%)

*Insight:* The dataset is heavily imbalanced towards negative sentiment, which is typical for customer support Twitter feeds. We need to handle this using class weights or TF-IDF parameter tuning during model training.

## Text Characteristics
- **Average Word Count (cleaned):** {avg_word_count:.2f} words per tweet.

## Airline Mentions (Topics Proxy)
{airline_counts.to_string()}

*Conclusion:* The data requires robust text cleaning (removing URLs, mentions, special characters) and TF-IDF vectorization. We will use a fast linear model (Logistic Regression) which typically performs excellently on sparse TF-IDF text features.
"""

report_path = os.path.join(reports_dir, "sentiment_eda_report.md")
with open(report_path, "w", encoding="utf-8") as f:
    f.write(report_content)

print(f"EDA report saved to: {report_path}")
print("=== Sentiment EDA Completed Successfully ===")
