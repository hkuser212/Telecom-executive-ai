import requests

url = "http://127.0.0.1:8000/predict-sentiment"
tests = [
    "The connection is absolutely fantastic! Best network ever.",
    "I'm very disappointed with the customer service and long hold times.",
    "My bill was 50 dollars this month.",
    "    ",
    "@username http://link.com #junk",
]

print("=== Testing /predict-sentiment Endpoint ===")
for text in tests:
    res = requests.post(url, json={"text": text})
    if res.status_code == 200:
        data = res.json()
        print(f"Input: '{text}' -> Sentiment: {data['sentiment'].upper()} (Confidence: {data['confidence']:.2f})")
    else:
        print(f"Error for '{text}': {res.text}")
