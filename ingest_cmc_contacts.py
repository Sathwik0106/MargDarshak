"""
Ingest all official municipal key contacts from Cyberabad Municipal Corporation (CMC)
(source: https://cmc.telangana.gov.in/KeyContacts.aspx) into the database.
"""
from html.parser import HTMLParser
from pathlib import Path
import sqlite3
from database import init_db, get_db_session, OfficerModel

class TableParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tables = []
        self.current_table = []
        self.current_row = []
        self.current_cell = []
        self.in_cell = False
        self.in_table = False

    def handle_starttag(self, tag, attrs):
        if tag == 'table':
            self.in_table = True
            self.current_table = []
        elif tag == 'tr' and self.in_table:
            self.current_row = []
        elif tag in ('td', 'th') and self.in_table:
            self.in_cell = True
            self.current_cell = []

    def handle_endtag(self, tag):
        if tag == 'table' and self.in_table:
            self.in_table = False
            self.tables.append(self.current_table)
        elif tag == 'tr' and self.in_table:
            if self.current_row:
                self.current_table.append(self.current_row)
        elif tag in ('td', 'th') and self.in_table:
            self.in_cell = False
            text = " ".join("".join(self.current_cell).split())
            self.current_row.append(text)

    def handle_data(self, data):
        if self.in_cell:
            self.current_cell.append(data)


TABLE_CATEGORIES = {
    1: "COMMISSIONER",
    2: "ADDITIONAL COMMISSIONERS",
    3: "ZONAL COMMISSIONER",
    4: "DEPUTY COMMISSIONER",
    5: "ASSISTANT MUNICIPAL COMMISSIONER",
    6: "TOWN PLANNING WING",
    7: "URBAN BIO DIVERSITY WING",
    8: "TRADE LICENSE WING",
    9: "HEALTH WING",
    10: "TRANSPORT WING",
    11: "ELECTRICAL WING",
    12: "ENGINEERING WING",
    13: "URBAN COMMUNITY DEVELOPMENT WING",
    14: "ENTOMOLOGY",
    15: "VETERINARY",
    16: "SANITATION",
    17: "FOOD SAFETY",
    18: "VIGILANCE AND ENFORCEMENT",
    19: "ESTATES",
    20: "SPORTS",
    21: "MLA",
    22: "MP (LOK SABHA)",
    23: "MLC",
}


def clean_str(val):
    if not val:
        return None
    val = val.strip()
    if val in ("-", "--", "None", "", "''"):
        return None
    return val


def parse_and_ingest():
    html_file = Path(__file__).parent / "scratch_cmc.html"
    if not html_file.exists():
        print("[!] scratch_cmc.html not found.")
        return

    parser = TableParser()
    with open(html_file, encoding="utf-8", errors="ignore") as f:
        parser.feed(f.read())

    print(f"[*] Parsed {len(parser.tables)} HTML tables from CMC KeyContacts")

    init_db()
    session = get_db_session()

    # Clear old officer records to have a clean, authoritative set
    session.query(OfficerModel).delete()
    session.commit()

    officers_to_insert = []
    officer_id = 1

    for table_idx, category in TABLE_CATEGORIES.items():
        if table_idx >= len(parser.tables):
            continue

        rows = parser.tables[table_idx]
        if not rows:
            continue

        headers = [h.lower() for h in rows[0]]

        for r in rows[1:]:
            # Skip empty placeholder rows
            if not any(r):
                continue

            name = None
            designation = category
            department = None
            zone = None
            circle = None
            constituency = None
            address = None
            contact_number = None
            email_id = None

            # Map based on table columns
            if table_idx == 1:
                # ['S.NO', 'Name', 'Designation', 'Contact Number', 'Email ID']
                if len(r) >= 3:
                    name = r[1]
                    designation = r[2]
                if len(r) >= 4:
                    contact_number = r[3]
                if len(r) >= 5:
                    email_id = r[4]

            elif table_idx == 2:
                # ['S.NO', 'Name', 'Designation', 'Department', 'Contact Number', 'Email ID']
                if len(r) >= 3:
                    name = r[1]
                    designation = r[2]
                if len(r) >= 4:
                    department = r[3]
                if len(r) >= 5:
                    contact_number = r[4]
                if len(r) >= 6:
                    email_id = r[5]

            elif table_idx == 3:
                # ['S.NO', 'Name', 'Designation', 'Zone', 'Contact Number', 'Email ID']
                if len(r) >= 3:
                    name = r[1]
                    designation = r[2]
                if len(r) >= 4:
                    zone = r[3]
                if len(r) >= 5:
                    contact_number = r[4]
                if len(r) >= 6:
                    email_id = r[5]

            elif table_idx in (4, 5, 6, 7, 8, 9, 10, 11):
                # ['S.NO', 'Name', 'Designation', 'Zone', 'Circle', 'Contact Number', 'Email ID']
                if len(r) >= 3:
                    name = r[1]
                    designation = r[2]
                if len(r) >= 4:
                    zone = r[3]
                if len(r) >= 5:
                    circle = r[4]
                if len(r) >= 6:
                    contact_number = r[5]
                if len(r) >= 7:
                    email_id = r[6]

            elif table_idx in (12, 13):
                # ['S.NO', 'Name', 'Zone', 'Circle', 'Designation', 'Contact Number', 'Email']
                if len(r) >= 2:
                    name = r[1]
                if len(r) >= 3:
                    zone = r[2]
                if len(r) >= 4:
                    circle = r[3]
                if len(r) >= 5:
                    designation = r[4]
                if len(r) >= 6:
                    contact_number = r[5]
                if len(r) >= 7:
                    email_id = r[6]

            elif table_idx == 14:
                # ['S.NO', 'Name', 'Designation', 'Circle', 'Contact Number', 'Email ID']
                if len(r) >= 3:
                    name = r[1]
                    designation = r[2]
                if len(r) >= 4:
                    circle = r[3]
                if len(r) >= 5:
                    contact_number = r[4]
                if len(r) >= 6:
                    email_id = r[5]

            elif table_idx in (15, 16, 17):
                # ['S.NO', 'Name...', 'Designation', 'Circle', 'Zone', 'Email ID', 'Contact Nos.']
                if len(r) >= 3:
                    name = r[1]
                    designation = r[2]
                if len(r) >= 4:
                    circle = r[3]
                if len(r) >= 5:
                    zone = r[4]
                if len(r) >= 6:
                    email_id = r[5]
                if len(r) >= 7:
                    contact_number = r[6]

            elif table_idx == 18:
                # ['S.NO', 'Name', 'Designation', 'Contact Number', 'Email ID']
                if len(r) >= 3:
                    name = r[1]
                    designation = r[2]
                if len(r) >= 4:
                    contact_number = r[3]
                if len(r) >= 5:
                    email_id = r[4]

            elif table_idx == 19:
                # ['S.NO', 'Name', 'Designation', 'Zone', 'Email ID', 'Contact Nos.']
                if len(r) >= 3:
                    name = r[1]
                    designation = r[2]
                if len(r) >= 4:
                    zone = r[3]
                if len(r) >= 5:
                    email_id = r[4]
                if len(r) >= 6:
                    contact_number = r[5]

            elif table_idx == 20:
                # ['S.NO', 'Name', 'Designation', 'Department', 'Email ID', 'Contact Nos.']
                if len(r) >= 3:
                    name = r[1]
                    designation = r[2]
                if len(r) >= 4:
                    department = r[3]
                if len(r) >= 5:
                    email_id = r[4]
                if len(r) >= 6:
                    contact_number = r[5]

            elif table_idx in (21, 22):
                # ['S.NO', 'No. & Name of the Constituency...', 'Name of...', 'Address...', 'Contact Nos.']
                if len(r) >= 3:
                    constituency = r[1]
                    name = r[2]
                if len(r) >= 4:
                    address = r[3]
                if len(r) >= 5:
                    contact_number = r[4]

            elif table_idx == 23:
                # ['S.NO', 'Name of the MLC', 'Address of Candidate', 'Contact Nos.']
                if len(r) >= 2:
                    name = r[1]
                if len(r) >= 3:
                    address = r[2]
                if len(r) >= 4:
                    contact_number = r[3]

            clean_name = clean_str(name)
            if not clean_name or clean_name.isdigit() or len(clean_name) < 2:
                continue

            officer = OfficerModel(
                id=officer_id,
                category_wing=category,
                name=clean_name,
                designation=clean_str(designation) or category,
                department=clean_str(department),
                zone=clean_str(zone),
                circle=clean_str(circle),
                constituency=clean_str(constituency),
                address=clean_str(address),
                contact_number=clean_str(contact_number),
                email_id=clean_str(email_id),
            )
            session.add(officer)
            officers_to_insert.append(officer)
            officer_id += 1

    session.commit()
    print(f"[+] Successfully ingested {len(officers_to_insert)} official CMC personnel into 'officers' table!")

    # Summary by Category Wing
    wing_counts = {}
    for o in officers_to_insert:
        wing_counts[o.category_wing] = wing_counts.get(o.category_wing, 0) + 1
    for wing, count in sorted(wing_counts.items()):
        print(f"    - {wing}: {count}")

    session.close()


if __name__ == "__main__":
    parse_and_ingest()
