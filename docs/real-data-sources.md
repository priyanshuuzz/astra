# ASTRA real-data source assessment

## Verified sources

The official Hyderabad District Government of Telangana hospital page provides a public list of UHNCs and Basthi Dawakhanas with facility names, administrative grouping, and map links. It is useful for a public primary-care facility registry, but it does not provide live beds, emergency acceptance, specialist rosters, or clinical capability verification.

The official Ayushman Bharat Digital Mission Health Facility Registry (HFR) describes itself as a comprehensive registry of verified public and private health facilities across systems of medicine, including hospitals, clinics, laboratories, diagnostic centres, and pharmacies. The HFR is therefore the preferred identity/provenance source for facility records; enrollment or authorized access is needed for richer facility data. The page was captcha-protected during retrieval, so no automated bulk export was assumed.

## Backend boundary

ASTRA can safely ingest facility identity, name, category, address, geographic coordinates, phone, source URL, source timestamp, and verification status from public/authorized sources. It must not infer ICU capacity, emergency acceptance, specialist availability, or ambulance ETA from directory presence. Those fields require an authenticated hospital coordinator feed or an explicitly authorized operational integration and must carry `last_verified_at`, `source`, and an uncertainty state.

## Recommended ingestion model

Store each facility as a canonical record with source identifiers and a provenance record. Keep raw source payloads and normalized records separate. Use an append-only import/audit record, deduplicate by source ID plus normalized name/address, and mark records `pending_verification` until a facility representative confirms operational capabilities. Live availability should expire into `stale` and then `unknown`, never silently remain ready.

## References

[1] [Hyderabad District Government of Telangana — Hospitals](https://hyderabad.telangana.gov.in/hospitals/)
[2] [Ayushman Bharat Digital Mission — Health Facility Registry](https://abdm.gov.in/health-facilities)
[3] [ABDM Health Facility Registry](https://facility.abdm.gov.in/)
