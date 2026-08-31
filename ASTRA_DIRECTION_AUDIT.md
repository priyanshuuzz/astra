# ASTRA Development Direction Audit

## Scope and conclusion

This audit compares the current ASTRA Expo/React Native implementation with the updated product direction: **Emergency Capability Registry + Case-Specific Hospital Acceptance & Referral Coordination Network**. The project already contains the core technical foundations for a credible MVP, especially deterministic clinical gates, a parallel acceptance handshake, Supabase access seams, realtime events, routing fallback, role-aware screens, and an explicitly simulated demo dataset. The principal mismatch is not that ASTRA lacks a workflow; it is that several screens and models still frame the workflow as a hospital-search or bed-availability experience rather than a verified-capability and confirmed-acceptance coordination transaction.

The safest next increment is therefore a focused reframing and safety hardening pass. It should preserve the functioning SOS, recommendation, handshake, routing, realtime alert, staff, and demo paths while making **case intake, verified capability, acceptance state, data provenance, and fallback/escalation** the visible system of record. Broad patient marketplace behavior, statewide expansion, real dispatch, specialist location tracking, and generic AI ranking should remain out of scope.

## 1. Existing architecture summary

ASTRA is a portrait-first Expo SDK 54 / React Native mobile application targeting iOS and Android, with Expo Router navigation and a local React-context state container. `lib/astra/store.tsx` owns active emergency sessions, hospital data, notifications, contacts, and persistence through AsyncStorage. Supabase is available through `lib/supabase.ts` and the hospital repository, while the local store remains the principal source for most screens and the demo workflow.

| Layer | Current implementation | Assessment |
|---|---|---|
| Mobile presentation | `app/`, `components/astra/`, safe-area screens, native/web map variants | Functional cross-platform foundation; terminology needs alignment |
| Navigation | Expo Router with SOS, recommendation, referral, map, cases, staff, admin, login, profile | Strong screen coverage; flows are broader than the narrow MVP |
| Domain model | `types/astra.ts` includes emergency types, capabilities, verification, hospital scores, acceptance requests, ambulances, notifications | Good foundation; needs explicit candidate/promotion and case-packet concepts |
| State/application layer | `lib/astra/store.tsx` with local persistence and demo hospital registry | Reliable demo seam; production Supabase data is not yet the primary store |
| Clinical decision service | `lib/astra/recommendation.ts` with hard gates, explainable scores, ETA/freshness inputs | Keep; make verified capability and case-specific requirements authoritative |
| Acceptance coordination | `lib/astra/handshake.ts`, `lib/acceptance-realtime.ts`, `lib/coordinator-alerts.ts` | Strong partial implementation; needs a first-class clarification state and explicit escalation audit events |
| Backend | Supabase Auth, PostgREST repository, realtime subscriptions, SQL schema, import script | Integration seam exists; schema/import execution remains an operational dependency |
| Maps and routing | MapLibre native renderer, web fallback, OSRM-compatible routing, direct-line fallback | Keep; ETA must remain deterministic and visibly degraded when offline |
| Data | 169 official Hyderabad directory records plus fictional ASTRA demo registry | Provenance boundary is understood; public directory records must not imply live capacity |
| Notifications | In-app coordinator alerts with accepted-request sound controls | Keep; production background delivery is not established |
| Auditability | Supabase `audit_events` schema and local notifications/history | Partial; important state transitions need normalized immutable event coverage |

## 2. Current implementation status

The current implementation is high-fidelity and already demonstrates the central sequence from emergency selection through recommendation, routing, acceptance, destination lock, failover, and coordinator alerting. Recommendation logic is deterministic rather than an opaque AI ranker. It includes clinical hard gates and an explainable score with clinical, availability, specialist, travel, readiness, and freshness components. The acceptance handshake supports multiple parallel requests, a countdown, first acceptance destination locking, decline/timeout states, and reassignment behavior.

Authentication and role-aware entry points exist for patient, crew, referring doctor, family, staff, and admin personas. Supabase Auth session handling and hospital read/write repository functions are present. Facility registry reads, administrator verification surfaces, realtime operational subscriptions, and coordinator capacity controls have been partially implemented. The current Supabase project hostname now resolves in the restored session, but the facility import previously failed because the target registry table was absent; this indicates that the supplied SQL schema still needs to be applied before importing the 169 records.

The largest presentational mismatch is language and source-of-truth placement. The local demo store still drives most hospital lists and the map. Supabase facility records are not yet automatically promoted into verified routing candidates, and the product has not yet fully separated **directory identity**, **verified capability**, **operational acceptance**, and **simulated availability** into distinct states visible to users.

## 3. Feature-by-feature KEEP / MODIFY / DEFER / REMOVE / NOT YET IMPLEMENTED

| Feature | Classification | Reason and intended treatment |
|---|---|---|
| Expo iOS/Android mobile app | KEEP | Directly satisfies the product constraint and is compatible with the revised direction |
| SOS emergency entry | MODIFY | Preserve simple non-diagnostic selection; add structured case fields for the first MVP condition |
| Deterministic clinical gates | KEEP | Core safety mechanism; it must remain authoritative over any future AI assistance |
| Multi-factor hospital score | MODIFY | Use only after hard gates and verified capability checks; rename from generic recommendation language |
| “Best hospital” / AI recommendation framing | REMOVE from product language | Replace with “Suitable receiving facilities” and “Why this facility is eligible” |
| Fictional Hyderabad demo hospitals | KEEP with labeling | Necessary for demonstration; every status must visibly say simulated/demo |
| Public live-bed dashboard framing | REMOVE | Bed numbers cannot imply usable capacity or current truth without an authorized operational feed |
| Facility registry and provenance | KEEP | Foundation for verified identity, coordinates, capability, freshness, and source review |
| Facility verification workflow | MODIFY | Add explicit capability attestation, coordinate validation, reviewer identity, freshness, and promotion status |
| Verified routing candidates | NOT YET IMPLEMENTED | Add a durable promotion boundary so only verified records enter routing candidate queries |
| Hospital acceptance transaction | KEEP and MODIFY | Preserve parallel handshake; add `needs_clarification`, structured packet, expiry, and explicit clinician/coordinator actor |
| Timeout, failover, escalation | KEEP and MODIFY | Preserve behavior and add explicit escalation policy/audit milestones |
| Live route/ETA | KEEP | Use open-source OSRM-compatible routing with visible direct-line/offline degradation |
| Ambulance simulation | KEEP for demo, DEFER for production dispatch | Demonstrates routing without claiming fleet dispatch integration |
| Real GPS foreground tracking | MODIFY | Keep permission-aware tracking; do not expand to specialist tracking or long-term location history |
| Realtime coordinator alerts | KEEP | Useful for acceptance operations; add background delivery only when a validated production channel exists |
| Sound notification | KEEP with operational controls | Appropriate for coordinator acceptance alerts; require mute/replay and platform validation |
| Hospital bed/capacity manual updates | MODIFY | Treat as authorized operational attestation with freshness, actor, and uncertainty labels—not public truth |
| Specialist records and statuses | MODIFY | Model service/on-call commitment and activation expectation; do not expose exact physical specialist location |
| Admin dashboard | MODIFY | Make it a registry review and audit console rather than a generic metrics page |
| Patient-facing hospital marketplace/search | DEFER | Secondary to crew/referrer and hospital coordinator workflow in the MVP |
| Family/contact notifications | DEFER | Preserve compatible demo behavior, but do not let it outrank clinical coordination work |
| Generic all-condition routing | DEFER | Select one initial use case, preferably stroke based on the supplied research direction |
| AI/ML hospital ranking | REMOVE or redesign if present | No evidence of a required AI ranking component in the audited code; deterministic rules remain authoritative |
| AI-assisted extraction/summarization | DEFER | Consider only as an auditable supporting feature after the core workflow is stable |
| Statewide deployment, 108/112 integration, blockchain, IoT sensors, fleet dispatch | DEFER | Explicitly outside the MVP and should not be introduced incrementally by accident |

## 4. Biggest technical gaps

The first gap is **data-source separation**. The local demo store is still the main source consumed by emergency, map, and related screens, so imported Supabase facilities cannot yet become the routing source through a single verified-candidate query. The second gap is the missing durable **promotion boundary** between `facility_registry` and `hospitals`: verification currently exists as a field, but the system needs a transaction or server-side function that only promotes records when coordinates, facility identity, and required capabilities are all valid.

The third gap is **workflow state completeness**. Acceptance requests currently model pending, accepted, declined, timeout, and assigned-elsewhere, but the revised direction requires `needs_clarification`, structured minimal de-identified packets, expiry, and explicit escalation events. The fourth gap is **audit completeness**: the schema has an audit table, but not every clinically meaningful transition is guaranteed to create an immutable event with actor, timestamp, previous state, new state, and reason.

The fifth gap is **operational data semantics**. Capacity and readiness fields exist, but they need freshness and provenance treatment that prevents a numeric value from being read as a live guarantee. The sixth gap is **schema execution and import operations**: the Supabase endpoint is reachable, but the registry table was not present when the importer was attempted, so the SQL migration must be applied through an authorized Supabase SQL pathway before real records can be loaded.

## 5. Biggest clinical and product gaps

ASTRA needs a narrower initial use case and a structured case intake model. The present SOS screen offers several emergency categories, which is useful for a demo but does not yet establish the minimum clinical data needed for a defensible first corridor. The revised product should choose one initial pathway—stroke is the recommended starting point from the supplied research direction—and ask only for operationally relevant, de-identified fields such as symptom onset window, acuity, airway/breathing concern, and required capability confirmation.

The product must make clear that **eligibility is not acceptance**. A facility can have a verified capability and still decline because the responsible team, equipment, or operational capacity is unavailable. The UI should therefore distinguish suitable candidate, request sent, clarification requested, accepted, declined, timed out, escalated, and confirmed destination. Likewise, a source directory can verify that a facility exists and where it is located without proving beds, specialist availability, acceptance, or current readiness.

Human oversight also needs to be visible. The product should show why a facility passed or failed gates, who verified the capability, when it was last verified, what remains unknown, and who confirmed the destination. Any fallback should be described as a safe escalation path rather than as a silent algorithmic rerank.

## 6. Recommended development sequence

| Priority | Sequence | Outcome |
|---|---|---|
| P0 | Choose and structure one initial clinical workflow; preserve hard gates; add explicit uncertainty and human override | Safer, defensible case intake and destination selection |
| P1 | Complete verified capability registry, facility promotion, acceptance clarification, expiry, and structured decline | Operational hospital coordination transaction |
| P2 | Connect verified candidates to routing/ETA and pre-arrival handoff; keep offline fallback visible | Reliable transport coordination without overstating precision |
| P3 | Normalize audit events, provenance, freshness, reliability metrics, and escalation history | Traceable operational system |
| P4 | Consider narrowly scoped AI assistance for extraction or summarization only | Supportive automation that cannot override rules |
| P5 | Expand secondary patient/family experiences and additional conditions | Broader product surface after the corridor workflow is validated |

## 7. Exact files intended for the first implementation increment

The first safe coding increment should focus on `types/astra.ts`, `lib/astra/recommendation.ts`, `lib/astra/handshake.ts`, `lib/astra/store.tsx`, `app/sos.tsx`, `app/recommendation.tsx`, `app/referral.tsx`, and `app/staff.tsx`. The Supabase boundary should be completed in `supabase/schema.sql`, `lib/supabase-hospital-repository.ts`, and the server-only importer. Map changes should remain limited to `app/map.tsx` and `components/astra/live-map*.tsx` after verified-candidate data is available.

The administrator experience should be refined in `app/admin.tsx`, but no destructive replacement is warranted. Existing compatible screens and demo paths should remain available while the terminology and source-of-truth boundaries are tightened.

## 8. Risks and assumptions

This audit assumes the supplied product-direction update is authoritative and that no clinical protocol, hospital agreement, or live operational feed has yet been provided. The current simulated hospitals and statuses are therefore suitable for demonstration only. The project must not imply clinical validation, mortality reduction, live specialist location, or dispatch integration.

The Supabase secret key must remain server-only. Facility promotion must not be implemented as a client-side privileged write. Realtime and sound alerts require native-device validation after a rebuilt development binary; web preview alone cannot establish iOS or Android behavior. Finally, the recommendation engine can be technically deterministic while still being clinically incomplete; a clinical safety review and corridor-specific capability definitions remain required before real-world use.
