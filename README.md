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
