# ASTRA Architecture

## Runtime shape

ASTRA is a portrait-first Expo/React Native application targeting iOS and Android. The current runtime is intentionally local and deterministic so a judge can demonstrate the emergency workflow without external credentials or network dependency. React context provides app state, AsyncStorage persists non-sensitive demo preferences, and Expo Router provides screen navigation.

## Layers

| Layer | Responsibility | Current implementation |
|---|---|---|
| Presentation | Safe-area screens, accessible controls, status labels, empty and recovery states | `app/` and `components/astra/` |
| Application state | Emergency session lifecycle, hospital updates, contacts, notifications, persistence | `lib/astra/store.tsx` |
| Domain | Hospital, specialist, ambulance, contact, notification, and emergency session models | `types/astra.ts` |
| Decision service | Multi-factor scoring, distance, ETA, freshness, and failover ranking | `lib/astra/recommendation.ts` |
| Data seam | Replaceable repository and service contracts | `lib/astra/contracts.ts` |
| Demo infrastructure | Fictional hospitals and current-state values | `data/demo.ts` |

## Recommendation flow

The SOS selection produces an `EmergencySession` with a simulated patient coordinate. The deterministic engine evaluates every available fictional hospital against emergency-specific clinical requirements. The current score combines clinical fit, capacity, specialist match, estimated travel, readiness, and freshness. Each score returns an explanation list and component values so the UI can show why a destination was selected rather than presenting an opaque “AI” answer.

Distance uses a Haversine calculation. Travel time adds a traffic multiplier. Freshness decreases after five, fifteen, and thirty minutes. The engine filters unavailable hospitals before ranking. If a hospital rejects a pre-alert, the store explicitly marks that hospital unavailable, recalculates the recommendation, changes the session status to redirected, and creates a visible availability-changed notification.

## Emergency lifecycle

`selecting → recommended → active → completed` is the normal path. A failed hospital pre-alert uses `redirected` until the patient reviews the new destination. Ambulance state moves from `dispatched` through `arriving`, `picked_up`, `en_route`, and `arrived`. The session keeps only coordination fields and notes required for the demo; it does not store unnecessary medical information.

## Future integration seams

A production implementation can add a `HospitalApiRepository` or `GovernmentHospitalRepository` behind `HospitalRepository`, a real GPS implementation behind `LocationService`, a Google Maps/Mapbox/OpenStreetMap adapter behind `RoutingService`, and an authenticated ambulance provider behind `AmbulanceService`. A backend should own identity, access control, data freshness validation, audit logs, notification delivery, and consented emergency data. FHIR, ABDM, hospital HIS, traffic, and ambulance connections must be separately verified and must not be implied by demo behavior.

## Privacy and security decisions

The local prototype stores only demo preferences, contacts, minimal history, and active coordination state. Location is represented by a simulated coordinate and is associated with the active session rather than a long-term location history. Before production, add secure storage for tokens, authenticated role-based routes, backend authorization, encrypted transport, least-privilege data access, retention controls, audit fields, consent, and a clinical safety review.
