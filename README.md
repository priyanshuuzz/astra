# ASTRA

ASTRA is a cross-platform Expo/React Native mobile prototype for emergency hospital availability and routing. It is designed to run as a real iOS and Android app, not as a website. The prototype helps a patient or family member compare simulated hospital readiness, capacity, clinical capability, travel time, and freshness, then coordinate a simulated ambulance, family alert, route, and hospital pre-alert.

> **Safety boundary:** ASTRA is not a doctor, diagnostic system, emergency service, or guarantee of hospital admission. In a life-threatening emergency, contact your local emergency service immediately.

## What is implemented

The patient journey is functional in demo mode: onboarding persists locally; a user can start an SOS, select an emergency type without diagnosing themselves, receive a multi-factor hospital recommendation, inspect the scoring breakdown, confirm a destination, request and advance a simulated ambulance, notify saved contacts, view a provider-agnostic simulated map, send a hospital pre-alert, trigger an explicit failover when a hospital cannot receive the patient, and complete the session into local history.

The demo also includes a hospital staff dashboard with readiness, ICU and emergency-bed controls, specialist status, and pre-alert acceptance/rejection. The administrator view shows connected hospitals, readiness, capacity, completed sessions, and data freshness. A profile/privacy view explains local demo storage, location sharing scope, contacts, and reset behavior.

## Run locally

Install Node.js and pnpm, then run `pnpm install` and `pnpm dev`. The project uses Expo SDK 54 and opens a web preview for quick review; scan the Expo QR code from the management UI with Expo Go for a native device run. Use `pnpm check` for the TypeScript check and `pnpm test` for the deterministic recommendation tests.

## Demo roles

The home screen includes a role switcher. Patient opens the emergency workflow. Hospital staff opens the operational dashboard. Administrator opens the system overview. All accounts and data are fictional and local to the demo. No live hospital, ambulance, map, traffic, government, FHIR, or ABDM integration is claimed.

## Architecture

The domain vocabulary is defined in `types/astra.ts`, fictional data is isolated in `data/demo.ts`, recommendation logic is deterministic in `lib/astra/recommendation.ts`, and state plus local persistence is in `lib/astra/store.tsx`. Replaceable interfaces live in `lib/astra/contracts.ts`; a future backend can implement those contracts without rewriting the screens. `design.md` documents the portrait information architecture, safety boundaries, and color system. `ARCHITECTURE.md` describes data flow and future integration seams.

## Environment and production considerations

`.env.example` documents the intentionally empty integration points. No secrets are committed. Native location, maps, phone calls, push notifications, secure authentication, backend persistence, hospital HIS/FHIR/ABDM integration, and ambulance/traffic APIs should be added only with verified providers, consent, privacy review, authenticated access, audit logging, and platform-specific configuration.

## Demo data disclosure

Every capacity and travel signal is fictional. Freshness is represented by timestamps and visible labels; old data is downgraded in the scoring engine rather than presented as live availability. The “map” is a simulated visualization so the app can be demonstrated without external API keys.

## Supabase and live location setup

The client reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY` from secure project configuration. The supplied Supabase project was reachable through its Auth settings endpoint during validation. Run `supabase/schema.sql` once in the Supabase SQL Editor to create profiles, hospitals, specialists, emergencies, ambulances, audit events, and row-level security policies. The hospital staff screen reads and updates `public.hospitals` through `lib/supabase-hospital-repository.ts`; if tables are not yet present or the device is offline, it retains a local demo fallback and labels the state.

Foreground GPS uses `expo-location` and requests permission before reading or watching the device position. The map screen uses `react-native-maps` on iOS and Android, shows the current position and hospital markers, and requests a Google Directions route when the restricted Google Maps key is available. The browser preview uses a non-native fallback because `react-native-maps` is a native module. A production build must restrict the Google key to the app’s iOS bundle identifier and Android package, enable the relevant Maps/Directions APIs, and rebuild the native binary after configuration changes.

Authentication uses Supabase email/password sessions with persisted tokens and a profile role payload. The current form supports patient sign-in/sign-up; hospital and administrator authorization should be completed by inserting approved roles in `profiles` and enforcing the included RLS policies. Do not place a Supabase service-role key in the mobile app.

## Keyless map and routing

ASTRA now uses an open-source provider path for the prototype. Native iOS and Android map rendering uses MapLibre React Native with an OpenStreetMap-derived demo style, while route geometry uses the OSRM-compatible HTTP API with a direct-line fallback when offline. The map surface must retain visible OpenStreetMap attribution. MapLibre native changes require a rebuilt development app; Expo Go alone cannot add native modules after installation. For production, replace demo tiles and the public OSRM endpoint with an owned or contracted provider and apply service-rate limits.

## Real facility registry ingestion

ASTRA includes a normalized snapshot of 169 facility records published by the Hyderabad District Government of Telangana at `data/real/hyderabad-government-facilities.json`. These records are public facility identity/location candidates, not live emergency-capacity claims; their capability and coordinates remain `pending_verification` until an authorized coordinator confirms them. The source assessment and links are documented in `docs/real-data-sources.md`.

Run `python3 scripts/collect_hyderabad_facilities.py` to refresh the snapshot. To import it into Supabase, first run `supabase/schema.sql`, then use a server-only environment containing `SUPABASE_SERVICE_ROLE_KEY` and execute `ASTRA_IMPORT_REAL_DATA=1 pnpm exec tsx scripts/import_hyderabad_facilities.ts`. Never expose the service-role key to the mobile client. Import runs are recorded in `facility_import_runs`, raw provenance is retained, and records are intentionally not promoted to verified/live status automatically.
