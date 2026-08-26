# ASTRA Mobile Experience Plan

## Product intent

ASTRA is an **emergency coordination prototype**, not a diagnostic tool or a substitute for local emergency services. The mobile experience must help a person reach a transparent, multi-factor hospital recommendation with as few decisions as possible, while clearly marking all availability, ambulance, and traffic signals as **simulated demo data**.

The application is designed for portrait, one-handed use on a 9:16 phone. The highest-priority action is permanently easy to identify, touch targets are at least 44 pt where practical, status is conveyed with text and icons as well as color, and emergency actions use clear confirmation and recovery states.

## Screen list

| Screen | Primary content and functionality |
|---|---|
| Launch and onboarding | ASTRA identity, safety notice, location rationale, persisted completion state, and a route into demo login. |
| Demo login and role selection | Patient, hospital staff, and administrator demo accounts; role-aware routes without real credential infrastructure. |
| Patient home | Current mock location, highly prominent SOS control, emergency-type shortcuts, hospital search, nearby hospital cards, and demo-data indicator. |
| SOS emergency-type selection | Plain-language emergency categories, including “I don’t know,” followed by simulated location detection with manual fallback. |
| Recommendation | Recommended hospital, score explanation, confidence/freshness signals, alternatives, medical disclaimer, confirm destination action, and selectable comparison dimensions. |
| Hospital discovery and detail | Search, filters, priority matrix, capability/bed/specialist data, freshness, contact and navigation actions. |
| Map and route | Simulated regional map, patient, hospital and ambulance positions, status markers, route/ETA summary, and a focused bottom sheet. |
| Emergency active | Golden-hour-style configurable session timer with careful time-sensitive-care guidance, confirmed destination, ambulance status, contacts, hospital status, and crisis actions. |
| Emergency contacts and notifications | Add/edit local contacts; simulated alert trail with emergency ID, destination, ETA, and notification history. |
| Emergency history | Persisted, minimal session records with status and timestamps; no unnecessary medical details. |
| Hospital staff dashboard | Readiness state, bed and specialist controls with validation, incoming pre-alert queue, accept/reject/redirection, and auditable timestamps. |
| Administrator dashboard | System metrics, simulated active emergencies, hospital freshness/readiness overview, and capacity trends. |
| Profile, privacy, and settings | Demo-mode acknowledgement, location-sharing state, retained-data explanation, and reset option. |

## Key user flows

The primary patient flow is: **launch → demo patient access → SOS → select “Serious accident” → acquire simulated location → calculate ranked hospitals → review recommendation → confirm hospital → request ambulance → notify contacts → hospital accepts pre-alert → track emergency → complete session**. A hospital rejection or a capacity change triggers an explicit failover notice and recalculation; the app never silently replaces a selected hospital.

The hospital staff flow is: **demo staff access → dashboard → review incoming emergency → accept, reject, or redirect → update readiness, beds, or specialists → timestamp the change**. The administrator flow is: **demo administrator access → review active emergencies and fleet/bed metrics → inspect freshness and readiness by hospital**.

## Layout and interaction rules

The patient home uses a calm white/blue foundation with a full-width emergency-red SOS panel in the upper third, location and profile controls above it, and scrollable hospital cards below. Recommendation and active-emergency screens use a persistent single-column hierarchy: safety notice, highest-value decision signal, context details, then actions. Dense operational screens use segmented controls, summary cards, and expandable rows rather than dashboard clutter.

All emergency actions include immediate visual feedback. Destructive or high-impact actions show an explicit confirmation sheet. Labels never rely on color alone: **Ready**, **Limited**, **Unavailable**, and **Unknown** appear with supporting iconography and plain-language freshness descriptions.

## Color choices

| Token | Hex | Intended use |
|---|---:|---|
| Clinical navy | `#0B2942` | Header, primary text, credible infrastructure tone. |
| ASTRA blue | `#0B78C6` | Standard primary actions, selected states, map routing. |
| SOS red | `#C82E38` | Emergency activation and urgent call-to-action only. |
| Ready green | `#1E7A52` | Confirmed availability with explicit “Ready” text. |
| Caution amber | `#A86A00` | Limited capacity and aging data states. |
| Surface mist | `#F4F8FB` | Screen ground and quiet grouped areas. |
| Data slate | `#536273` | Supporting metadata and timestamps. |

## Safety and demo boundaries

Every emergency pathway prominently states: **“In a life-threatening emergency, contact your local emergency service immediately.”** Hospital, traffic, navigation, ambulance, and notifications are marked as simulations unless a future integration explicitly supplies verified live data. The recommendation is described as a transparent coordination aid; it does not diagnose, guarantee admission, or replace healthcare professionals.

