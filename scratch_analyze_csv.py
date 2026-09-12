import csv
import json

path = r"C:\Users\manvi\OneDrive\Desktop\MargD1\contact_details.csv"

with open(path, mode="r", encoding="utf-8-sig", errors="ignore") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f"Total rows: {len(rows)}")
print("Columns:", reader.fieldnames)

print("\n--- ALL CATEGORIES AND COUNTS ---")
cats = {}
for r in rows:
    c = r.get("Category_Wing", "").strip()
    cats[c] = cats.get(c, 0) + 1
for c, cnt in sorted(cats.items(), key=lambda x: x[1], reverse=True):
    print(f"{c}: {cnt}")

print("\n--- ENGINEERING WING DETAILS ---")
for r in rows:
    if "ENGINEERING" in r.get("Category_Wing", "") or "TRANSPORT" in r.get("Category_Wing", "") or "ELECTRICAL" in r.get("Category_Wing", ""):
        print(f"[{r.get('Category_Wing')}] {r.get('Name')} | {r.get('Designation')} | Zone: {r.get('Zone')} | Circle: {r.get('Circle')} | Phone: {r.get('Contact_Number')} | Email: {r.get('Email_ID')}")

print("\n--- ZONAL & DEPUTY COMMISSIONERS ---")
for r in rows:
    if "COMMISSIONER" in r.get("Category_Wing", ""):
        print(f"[{r.get('Category_Wing')}] {r.get('Name')} | {r.get('Designation')} | Dept: {r.get('Department')} | Zone: {r.get('Zone')} | Circle: {r.get('Circle')} | Phone: {r.get('Contact_Number')} | Email: {r.get('Email_ID')}")

print("\n--- SANITATION & HEALTH WINGS ---")
for r in rows:
    if r.get("Category_Wing", "") in ["SANITATION", "HEALTH WING", "VIGILANCE AND ENFORCEMENT"]:
        print(f"[{r.get('Category_Wing')}] {r.get('Name')} | {r.get('Designation')} | Zone: {r.get('Zone')} | Circle: {r.get('Circle')} | Phone: {r.get('Contact_Number')} | Email: {r.get('Email_ID')}")
