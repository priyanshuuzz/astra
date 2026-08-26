# Project TODO

- [x] Define ASTRA portrait mobile interface plan and safety boundaries
- [x] Create brand theme, custom launcher assets, and app configuration
- [x] Establish models, repository interfaces, demo dataset, scoring engine, and local persistence
- [x] Implement onboarding, demo login, and role-aware navigation
- [x] Implement patient dashboard, hospital search, filters, priority views, and hospital details
- [x] Implement the SOS, location fallback, recommendation, failover, and emergency-active flows
- [x] Implement map/routing abstraction, simulated ambulance lifecycle, contact alerts, and notification log
- [x] Implement hospital-staff availability management and pre-alert decisions
- [x] Implement administrator metrics and system monitoring experience
- [x] Implement offline/degraded, validation, and empty/error states
- [x] Add unit and interaction tests for scoring, freshness, failover, SOS, and core workflow
- [x] Write README, architecture documentation, environment example, and demo instructions
- [x] Verify mobile presentation and save a delivery checkpoint
- [x] Confirm delivery as a real iOS and Android mobile app, not a website; continue with Expo/React Native cross-platform implementation

# Integration Requests

- [x] Add Supabase project URL and publishable key configuration through secure project secrets
- [x] Add Supabase schema, row-level security policies, and typed repository for hospitals, beds, specialists, emergencies, and audit events
- [x] Add real user authentication with email/password session persistence and role-aware access
- [x] Add real GPS permission handling, current-position updates, and manual fallback
- [x] Add live map and ambulance routing provider integration with route/ETA refresh and degraded fallback
- [x] Connect hospital staff dashboard reads and writes to Supabase with authenticated authorization
- [ ] Add integration tests and verify mobile behavior on iOS and Android
