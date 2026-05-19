# Exploratory Data Analysis (EDA) Report

**Total Customers:** 7043
**Overall Churn Rate:** 26.54%

## Summary Statistics for Numerical Columns
```text
            tenure  MonthlyCharges  TotalCharges
count  7043.000000     7043.000000   7043.000000
mean     32.371149       64.761692   2279.734304
std      24.559481       30.090047   2266.794470
min       0.000000       18.250000      0.000000
25%       9.000000       35.500000    398.550000
50%      29.000000       70.350000   1394.550000
75%      55.000000       89.850000   3786.600000
max      72.000000      118.750000   8684.800000
```

## Categorical Insights
### Churn by gender
```text
Churn          No        Yes
gender                      
Female  73.079128  26.920872
Male    73.839662  26.160338
```

### Churn by SeniorCitizen
```text
Churn                 No        Yes
SeniorCitizen                      
0              76.393832  23.606168
1              58.318739  41.681261
```

### Churn by Partner
```text
Churn           No        Yes
Partner                      
No       67.042021  32.957979
Yes      80.335097  19.664903
```

### Churn by Dependents
```text
Churn              No        Yes
Dependents                      
No          68.720860  31.279140
Yes         84.549763  15.450237
```

### Churn by Contract
```text
Churn                  No        Yes
Contract                            
Month-to-month  57.290323  42.709677
One year        88.730482  11.269518
Two year        97.168142   2.831858
```

### Churn by PaymentMethod
```text
Churn                             No        Yes
PaymentMethod                                  
Bank transfer (automatic)  83.290155  16.709845
Credit card (automatic)    84.756899  15.243101
Electronic check           54.714588  45.285412
Mailed check               80.893300  19.106700
```

