# Open-source map and routing decision

MapLibre React Native is a native Android/iOS wrapper and supports React Native 0.80+, the New Architecture, and Android API 23+. Its official setup requires an app rebuild and a style/tiles source; the project’s Expo SDK 54 and Android minSdk 24 satisfy the stated baseline. For production, the style/tiles source should be owned or supplied by a provider rather than relying on demo tiles.

OSRM’s HTTP route service accepts ordered coordinates and supports `geometries=geojson` with `overview=full`, which is sufficient for decoding route geometry into ASTRA’s `RoutePoint[]` without a provider API key. The public OSRM demo endpoint is suitable for a prototype with throttling and graceful fallback; a production deployment should self-host or use an explicitly contracted service.

ASTRA will use a provider abstraction: OpenStreetMap-derived MapLibre styling for native builds where the native module is available, OSRM-compatible routing for route geometry, and a direct two-point route fallback when the network/provider is unavailable. All map views must display visible OpenStreetMap attribution and identify demo/third-party data limits.

References:

[1] [MapLibre React Native — Getting Started](https://maplibre.org/maplibre-react-native/docs/setup/getting-started/)
[2] [OSRM API Documentation](https://project-osrm.org/docs/v5.24.0/api/)
[3] [OpenStreetMap Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/)
