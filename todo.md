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
- [x] Add integration tests and verify mobile behavior on iOS and Android

# Bug Fixes

- [x] Fix demo mode so users can bypass Supabase authentication and enter the local emergency workflow

# ASTRA V2 Specification

- [x] Reframe primary workflow around crew/referring-doctor initiation and verified hospital acceptance, not bed-count browsing
- [x] Add crew, hospital coordinator, referring doctor, family, admin, and hospital-admin role flows
- [x] Expand hospital capability registry with provenance, verification states, layers, and specialty classifications
- [x] Add deterministic emergency capability gates and explainable ranking for stroke, cardiac, trauma, burns, pediatric, obstetric, and general cases
- [x] Add acceptance handshake with countdown, decline reasons, destination lock, failover, referral/pre-alert, and audit trail
- [x] Add Hyderabad fictional demo registry and clearly label all simulated data
- [x] Add resilient offline, stale-data, duplicate-request, rate-limit, and authorization states
- [x] Add architecture and operational documentation for backend replacement, privacy, security, analytics, and deployment readiness

# Realtime and Native Validation

- [x] Add Supabase Realtime acceptance-event subscription service with channel cleanup and authenticated filtering
- [x] Surface coordinator alerts for new requests, acceptances, declines, timeouts, and assigned-elsewhere events
- [x] Add native GPS permission-state handling for denied, restricted, unavailable, and granted states
- [x] Add native map configuration validation for iOS and Android Google Maps keys and route rendering fallback
- [x] Add deterministic Realtime, alert, GPS-permission, and native-config tests

# Open-Source Map and Routing Fallback

- [x] Remove the required Google Maps key from ASTRA’s runtime path
- [x] Add open-source route fetching with OSRM-compatible geometry and safe direct-line fallback
- [x] Replace native map provider assumptions with a keyless provider abstraction suitable for Expo builds
- [x] Update map attribution, privacy copy, and documentation for OpenStreetMap/open-source services
- [x] Add deterministic tests for route decoding, provider fallback, and no-key native configuration

# Acceptance Simulation and Coordinator UX

- [x] Add a safe Supabase acceptance-row simulator that is opt-in and never runs automatically in production
- [x] Add end-to-end alert-delivery verification for new, accepted, declined, timeout, and assigned-elsewhere events
- [x] Add visible OpenStreetMap attribution to native and web map surfaces
- [x] Add clear offline/direct-line fallback status and retry UI
- [x] Add accepted-ambulance sound notification with mute/replay controls and native-safe fallback

# Real Data and Backend

- [x] Define real-data source hierarchy and healthcare safety boundaries
- [x] Collect and normalize 169 official Hyderabad District Government facility records
- [x] Add Supabase facility registry, provenance, verification, and import-run audit schema
- [x] Add server-only opt-in Supabase importer and repository access for facility records
- [x] Document real-data source links, freshness, privacy, and service-key boundaries
- [x] Add authorized hospital coordinator feeds for live beds, specialists, acceptance, and ambulance status
- [ ] Promote reviewed facility records into verified routing candidates after coordinate/capability validation
