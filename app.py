from flask import Flask, render_template, request
import pickle
import pandas as pd
import os

app = Flask(__name__)

# Load model, columns, and MAE
with open("interest_rate_model.pkl", "rb") as f:
    model = pickle.load(f)
print("Model loaded:", type(model))  # Confirm model class

with open("interest_rate_columns.pkl", "rb") as f:
    expected_columns = pickle.load(f)

with open("interest_rate_mae.pkl", "rb") as f:
    mae = pickle.load(f)

@app.route('/')
def home():
    return render_template('index.html')  # Home page

@app.route('/Dashboard')
def about():
    return render_template('Dashboard.html')  # Dashboard page

@app.route('/predict_interest', methods=['POST'])
def predict_interest():
    try:
        # Gather inputs from form
        data = {key: request.form[key] for key in request.form}
        df = pd.DataFrame([data])
        
        # Convert numeric columns
        numeric_cols = [
            'loan_amnt', 'term', 'grade_score', 'emp_length', 'income_all',
            'dti_all', 'credit_history_months', 'open_acc', 'pub_rec',
            'revol_bal', 'revol_util', 'total_acc', 'acc_now_delinq',
            'tot_coll_amt', 'tot_cur_bal'
        ]
        df[numeric_cols] = df[numeric_cols].apply(pd.to_numeric)

        # One-hot encode categorical features and align
        df_encoded = pd.get_dummies(df)
        df_encoded = df_encoded.reindex(columns=expected_columns, fill_value=0)

        # Predict interest rate
        pred = model.predict(df_encoded)[0]
        confidence_low = pred - mae
        confidence_high = pred + mae

        return render_template(
            "index.html",
            prediction=round(pred, 2),
            conf_low=round(confidence_low, 2),
            conf_high=round(confidence_high, 2),
            show_result=True
        )

    except Exception as e:
        return f"Error during prediction: {e}"

if __name__ == '__main__':
    app.run(debug=True)
