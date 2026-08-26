import { Map, Camera, Marker, GeoJSONSource, Layer, UserLocation } from "@maplibre/maplibre-react-native";
import { StyleSheet, Text, View } from "react-native";
import type { Coordinates, Hospital } from "@/types/astra";
import type { RoutePoint } from "@/lib/routing-service";

const MAP_STYLE = "https://demotiles.maplibre.org/style.json";
const point = (item: { latitude: number; longitude: number }): [number, number] => [item.longitude, item.latitude];

export function LiveMap({ location, hospitals, selectedHospitalId, ambulanceLocation, routeCoordinates, routeMode = "live" }: { location: Coordinates; hospitals: Hospital[]; selectedHospitalId?: string; ambulanceLocation?: Coordinates; routeCoordinates?: RoutePoint[]; routeMode?: "live" | "fallback" }) {
  const selected = hospitals.find((item) => item.id === selectedHospitalId) ?? hospitals[0];
  const route = routeCoordinates?.length ? routeCoordinates : selected ? [{ latitude: location.latitude, longitude: location.longitude }, { latitude: selected.location.latitude, longitude: selected.location.longitude }] : [];
  const routeShape = { type: "Feature" as const, properties: {}, geometry: { type: "LineString" as const, coordinates: route.map(point) } };
  return <View style={styles.wrap}><Map style={styles.map} mapStyle={MAP_STYLE}><Camera zoom={11} center={point(location)} /><UserLocation animated accuracy minDisplacement={10} /><Marker id="user" lngLat={point(location)}><Pin color="#C82E38" label="You" /></Marker>{hospitals.map((hospital) => <Marker key={hospital.id} id={hospital.id} lngLat={point(hospital.location)}><Pin color={hospital.id === selectedHospitalId ? "#0B78C6" : hospital.readiness === "ready" ? "#1E7A52" : "#A86A00"} label="Hospital" /></Marker>)}{ambulanceLocation && <Marker id="ambulance" lngLat={point(ambulanceLocation)}><Pin color="#A86A00" label="Ambulance" /></Marker>}{route.length > 1 && <GeoJSONSource id="astra-route" data={routeShape}><Layer id="astra-route-line" type="line" source="astra-route" style={{ lineColor: "#0B78C6", lineWidth: 4, lineOpacity: 0.85 }} /></GeoJSONSource>}</Map><View style={styles.attribution}><Text style={styles.attributionText}>© OpenStreetMap contributors · {routeMode === "fallback" ? "Direct-line fallback" : "OSRM-compatible route"}</Text></View></View>;
}
function Pin({ color, label }: { color: string; label: string }) { return <View style={[styles.pin, { backgroundColor: color }]}><Text style={styles.pinText}>{label.slice(0, 1)}</Text></View>; }
const styles = StyleSheet.create({ wrap: { flex: 1, position: "relative" }, map: { flex: 1 }, pin: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: "#0B2942", shadowOpacity: 0.22, shadowRadius: 4, elevation: 3 }, pinText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" }, attribution: { position: "absolute", left: 8, bottom: 8, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6, backgroundColor: "#FFFFFFE6" }, attributionText: { color: "#536273", fontSize: 9, fontWeight: "700" } });
