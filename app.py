from flask import Flask, render_template, request
import pickle
import pandas as pd

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

# === Homepage ===
@app.route('/')
def home():
    return render_template('index.html')

# === Dashboard Page ===
@app.route('/Dashboard')
def about():
    return render_template('Dashboard.html')

# === Model Page ===
@app.route('/Model')
def ml():
    return render_template('MLModel.html')

# === Refinance Page: Table + Lookup ===
@app.route('/Refinance', methods=['GET', 'POST'])
def rf():
    try:
        # Load top 100 refinance candidates table
        top_100 = pd.read_csv("top_risky_clients_filtered.csv")
        top_100_table = top_100.to_html(classes="table table-striped", index=False)

        client_before = None
        client_after = None
        error = None

        if request.method == 'POST':
            member_id = request.form.get('member_id')

            try:
                # Explicitly define column names for lookup CSV
                columns = [
                    'expected_income_actual', 'expected_income_refin', 'id', 'int_rate_new',
                    'int_rate_original', 'net_improvement', 'p_default_new', 'p_default_original',
                    'status', 'term_left', 'term_new'
                ]
                lookup_df = pd.read_csv('client_refinancing_lookup.csv', names=columns, header=None)

                print("Lookup DF columns:", lookup_df.columns.tolist())
                print("Member ID being searched:", member_id)

                # Find client row by ID
                client_data = lookup_df[lookup_df['id'].astype(str) == str(member_id)]

                if client_data.empty:
                    error = "No client found with that Member ID."
                else:
                    client_row = client_data.iloc[0]

                    print("Raw values from CSV:")
                    for col in ['id', 'int_rate_original', 'term_left', 'p_default_original', 'expected_income_actual', 'status']:
                        if col in client_row:
                            print(f"  {col}: {client_row[col]} (type: {type(client_row[col])})")

                    # === Robust numeric parser ===
                    def safe_numeric(value, default=0):
                        try:
                            if pd.isna(value) or str(value).strip() in ['', 'nan', 'None']:
                                return default

                            str_value = str(value).strip()
                            str_value = str_value.replace('€', '').replace('$', '').replace('\xa0', '').replace(' ', '')

                            if ',' in str_value:
                                if str_value.count(',') == 1 and str_value.count('.') == 1:
                                    if str_value.find(',') > str_value.find('.'):
                                        str_value = str_value.replace('.', '').replace(',', '.')
                                elif str_value.count(',') == 1:
                                    str_value = str_value.replace(',', '.')
                                else:
                                    str_value = str_value.replace(',', '')

                            return float(str_value)
                        except Exception as e:
                            print(f"[safe_numeric] Could not parse '{value}' → {e}")
                            return default

                    # === Client BEFORE refinancing ===
                    client_before = {
                        'id': client_row['id'],
                        'int_rate': safe_numeric(client_row.get('int_rate_original'), 0),
                        'term_months': safe_numeric(client_row.get('term_left'), 0),
                        'p_default': safe_numeric(client_row.get('p_default_original'), 0),
                        'expected_income_actual': safe_numeric(client_row.get('expected_income_actual'), 0)
                    }

                    print("Processed client_before:", client_before)

                    # === Client AFTER refinancing (if applicable) ===
                    if pd.notna(client_row.get('status')) and client_row['status'] != 'No refinancing recommended':
                        client_after = {
                            'int_rate_refin': safe_numeric(client_row.get('int_rate_new'), 0),
                            'term_months_refin': safe_numeric(client_row.get('term_new'), 0),
                            'p_default_refin': safe_numeric(client_row.get('p_default_new'), 0),
                            'expected_income_refin': safe_numeric(client_row.get('expected_income_refin'), 0),
                            'net_improvement': safe_numeric(client_row.get('net_improvement'), 0)
                        }
                        print("Processed client_after:", client_after)

            except Exception as data_error:
                print(f"Data processing error: {data_error}")
                error = f"Error processing data: {data_error}"

        return render_template(
            "Refinance.html",
            top_100_table=top_100_table,
            client_before=client_before,
            client_after=client_after,
            error=error
        )

    except Exception as e:
        print(f"Full error: {e}")
        return f"Could not load refinance page: {e}"


# === Predict Interest Rate for New Clients ===
@app.route('/predict_interest', methods=['POST'])
def predict_interest():
    try:
        data = {key: request.form[key] for key in request.form}
        df = pd.DataFrame([data])

        numeric_cols = [
            'loan_amnt', 'term', 'grade_score', 'emp_length', 'income_all',
            'dti_all', 'credit_history_months', 'open_acc', 'pub_rec',
            'revol_bal', 'revol_util', 'total_acc', 'acc_now_delinq',
            'tot_coll_amt', 'tot_cur_bal'
        ]
        df[numeric_cols] = df[numeric_cols].apply(pd.to_numeric)

        df_encoded = pd.get_dummies(df)
        df_encoded = df_encoded.reindex(columns=expected_columns, fill_value=0)

        pred = model.predict(df_encoded)[0]
        confidence_low = pred - mae
        confidence_high = pred + mae

        def predict_class_and_probs(input_df):
            encoded = pd.get_dummies(input_df)
            encoded = encoded.reindex(columns=classifier_features, fill_value=0)
            proba = classifier.predict_proba(encoded)[0]
            labels = label_encoder.inverse_transform(classifier.classes_)
            probs = dict(zip(labels, proba))
            label = max(probs, key=probs.get)
            return label, probs

        df_final = df.copy()
        df_final['int_rate'] = pred
        predicted_label, class_probs = predict_class_and_probs(df_final)

        df_low = df.copy()
        df_low['int_rate'] = confidence_low
        predicted_label_low, class_probs_low = predict_class_and_probs(df_low)

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

# === Run the Flask App ===
import os

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))  # Use Railway's port or fallback to 5000 locally
    app.run(host='0.0.0.0', port=port)
