from flask import Flask, render_template, request
import pickle
import pandas as pd
import os

app = Flask(__name__)

# === Load Regression Model ===
with open("interest_rate_model.pkl", "rb") as f:
    model = pickle.load(f)

with open("interest_rate_columns.pkl", "rb") as f:
    expected_columns = pickle.load(f)

with open("interest_rate_mae.pkl", "rb") as f:
    mae = pickle.load(f)

# === Load Classification Model ===
with open("xgb_model_perm.pkl", "rb") as f:
    class_bundle = pickle.load(f)
    classifier = class_bundle['model']
    label_encoder = class_bundle['label_encoder']
    classifier_features = classifier.get_booster().feature_names

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/Dashboard')
def about():
    return render_template('Dashboard.html')

@app.route('/Dataset')
def dataset():
    return render_template('Dataset.html')

@app.route('/Model')
def ml():
    return render_template('MLModel.html')

@app.route('/predict_interest', methods=['POST'])
def predict_interest():
    try:
        # === Step 1: Gather and clean form input ===
        data = {key: request.form[key] for key in request.form}
        df = pd.DataFrame([data])

        numeric_cols = [
            'loan_amnt', 'term', 'grade_score', 'emp_length', 'income_all',
            'dti_all', 'credit_history_months', 'open_acc', 'pub_rec',
            'revol_bal', 'revol_util', 'total_acc', 'acc_now_delinq',
            'tot_coll_amt', 'tot_cur_bal'
        ]
        df[numeric_cols] = df[numeric_cols].apply(pd.to_numeric)

        # === Step 2: Predict interest rate and bounds ===
        df_encoded = pd.get_dummies(df)
        df_encoded = df_encoded.reindex(columns=expected_columns, fill_value=0)

        pred = model.predict(df_encoded)[0]
        confidence_low = pred - mae
        confidence_high = pred + mae

        # === Helper function: Predict class and probabilities ===
        def predict_class_and_probs(input_df):
            encoded = pd.get_dummies(input_df)
            encoded = encoded.reindex(columns=classifier_features, fill_value=0)
            proba = classifier.predict_proba(encoded)[0]
            labels = label_encoder.inverse_transform(classifier.classes_)
            probs = dict(zip(labels, proba))
            label = max(probs, key=probs.get)
            return label, probs

        # === Final Prediction
        df_final = df.copy()
        df_final['int_rate'] = pred
        predicted_label, class_probs = predict_class_and_probs(df_final)

        # === Lower Bound
        df_low = df.copy()
        df_low['int_rate'] = confidence_low
        predicted_label_low, class_probs_low = predict_class_and_probs(df_low)

        # === Upper Bound
        df_high = df.copy()
        df_high['int_rate'] = confidence_high
        predicted_label_high, class_probs_high = predict_class_and_probs(df_high)

        return render_template(
            "index.html",
            prediction=round(pred, 2),
            conf_low=round(confidence_low, 2),
            conf_high=round(confidence_high, 2),
            predicted_label=predicted_label,
            class_probs=class_probs,
            predicted_label_low=predicted_label_low,
            class_probs_low=class_probs_low,
            predicted_label_high=predicted_label_high,
            class_probs_high=class_probs_high,
            show_result=True
        )

    except Exception as e:
        return f"Error during prediction: {e}"

import os

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))  # Use Railway's port or fallback to 5000 locally
    app.run(host='0.0.0.0', port=port)
