import pandas as pd

df = pd.read_csv("client_refinancing_lookup.csv")

print("\n📋 Column Names in CSV (with representation):\n")
for i, col in enumerate(df.columns):
    print(f"{i+1:02d}. {repr(col)}")

print("\n🔍 Columns containing 'expected' or 'income':\n")
for col in df.columns:
    if 'expected' in col.lower() or 'income' in col.lower():
        print(f"🔎 Found: {repr(col)}")
