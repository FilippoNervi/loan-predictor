import pickle
import pandas as pd

# Load the trained XGBoost model
with open('xgboost_model.pkl', 'rb') as f:
    model = pickle.load(f)

def predict_loan_risk(input_data):
    """
    input_data: dict
        Example:
        {
            'loan_contracted': 10000,
            'loan_period': 36,
            'interest_rate': 8.5,
            'grade': 'B',
            'purpose': 'car',
            'employment': 'full-time',
            'city': 'madrid'
        }
    """
    df = pd.DataFrame([input_data])
    
    # Optionally one-hot encode or preprocess here if your model needs it

    prediction = model.predict(df)
    
    return prediction[0]
