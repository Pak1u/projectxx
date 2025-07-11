import pandas as pd
from sklearn.linear_model import LinearRegression
import numpy as np

# Load the CSV file
df = pd.read_csv('sales_data_july_weeks.csv', sep='\t|,', engine='python')
df.columns = [col.strip() for col in df.columns]

# Convert Date to datetime
if not pd.api.types.is_datetime64_any_dtype(df['Date']):
    df['Date'] = pd.to_datetime(df['Date'])

df['Year'] = df['Date'].dt.year

# Group by Year and Item Name, sum Quantity Sold for July 11-14
agg = df.groupby(['Year', 'Item Name'])['Quantity Sold'].sum().reset_index()

# Estimate total for July 11-17 by scaling up (7/4)
agg['Estimated_Week_Quantity'] = agg['Quantity Sold'] * (7/4)

# Prepare predictions using Linear Regression for each item
items = agg['Item Name'].unique()
predictions = []

for item in items:
    item_data = agg[agg['Item Name'] == item]
    X = item_data['Year'].values.reshape(-1, 1)
    y = item_data['Estimated_Week_Quantity'].values
    if len(X) > 1:
        model = LinearRegression()
        model.fit(X, y)
        pred_2024 = model.predict(np.array([[2024]]))[0]
    else:
        # Not enough data for regression, fallback to mean
        pred_2024 = y.mean()
    predictions.append({'Item Name': item, 'Predicted_Quantity_2024': int(round(pred_2024))})

# Output predictions
print('Predicted sales for July 11-17, 2024 (using Linear Regression):')
for pred in predictions:
    print(f"Item: {pred['Item Name']}, Predicted Quantity: {pred['Predicted_Quantity_2024']}") 