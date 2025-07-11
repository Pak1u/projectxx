from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from sklearn.linear_model import LinearRegression
import numpy as np

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load and process data on startup
df = pd.read_csv('sales_data_july_weeks.csv', sep='\t|,', engine='python')
df.columns = [col.strip() for col in df.columns]
if not pd.api.types.is_datetime64_any_dtype(df['Date']):
    df['Date'] = pd.to_datetime(df['Date'])
df['Year'] = df['Date'].dt.year
agg = df.groupby(['Year', 'Item Name'])['Quantity Sold'].sum().reset_index()
agg['Estimated_Week_Quantity'] = agg['Quantity Sold'] * (7/4)

# Prepare predictions dict for quick lookup
def get_prediction(item_name):
    item_name = item_name.lower()
    item_data = agg[agg['Item Name'].str.lower() == item_name]
    if item_data.empty:
        return None
    X = item_data['Year'].values.reshape(-1, 1)
    y = item_data['Estimated_Week_Quantity'].values
    if len(X) > 1:
        model = LinearRegression()
        model.fit(X, y)
        pred_2024 = int(round(model.predict(np.array([[2024]]))[0]))
    else:
        pred_2024 = int(round(y.mean()))
    return pred_2024

@app.get('/predict')
def predict(item_name: str = Query(..., description="Name of the item to predict for")):
    pred = get_prediction(item_name)
    if pred is None:
        return JSONResponse(status_code=404, content={"error": f"Item '{item_name}' not found in data."})
    return {"item_name": item_name, "predicted_quantity_2024": pred} 