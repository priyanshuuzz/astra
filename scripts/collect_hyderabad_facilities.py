import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from bs4 import BeautifulSoup

SOURCE_URL = "https://hyderabad.telangana.gov.in/hospitals/"
OUT = Path("data/real/hyderabad-government-facilities.json")

def main():
    html = urlopen(Request(SOURCE_URL, headers={"User-Agent": "ASTRA-facility-registry-research/1.0"}), timeout=30).read()
    soup = BeautifulSoup(html, "html.parser")
    rows = []
    table = soup.find("table")
    if not table:
        raise RuntimeError("Official source table was not found; refusing to create partial data")
    for row in table.find_all("tr")[1:]:
        cells = row.find_all(["td", "th"])
        if len(cells) < 4:
            continue
        number = cells[0].get_text(" ", strip=True)
        group = cells[1].get_text(" ", strip=True)
        name = cells[2].get_text(" ", strip=True)
        link = cells[3].find("a")
        map_url = link.get("href") if link else None
        if not re.fullmatch(r"\d+", number) or not name:
            continue
        rows.append({"source_record_id": f"hyderabad-gov-{number}", "name": name, "facility_category": "Basthi Dawakhana / UPHC-linked primary care", "administrative_group": group, "address": name, "latitude": None, "longitude": None, "map_url": map_url, "source_name": "Hyderabad District Government of Telangana", "source_url": SOURCE_URL, "verification_status": "pending_verification", "raw_payload": {"sl_no": number, "uhnc": group, "published_name": name, "map_url": map_url}})
    if len(rows) < 10:
        raise RuntimeError(f"Only {len(rows)} records parsed; refusing to write unexpectedly small import")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"source_url": SOURCE_URL, "retrieved_at": datetime.now(timezone.utc).isoformat(), "records": rows}, indent=2) + "\n")
    print(f"Wrote {len(rows)} real public facility records to {OUT}")

if __name__ == "__main__":
    main()
