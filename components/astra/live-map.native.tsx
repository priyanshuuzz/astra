import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { StyleSheet } from "react-native";
import type { Coordinates, Hospital } from "@/types/astra";
import type { RoutePoint } from "@/lib/routing-service";

export function LiveMap({ location, hospitals, selectedHospitalId, ambulanceLocation, routeCoordinates }: { location: Coordinates; hospitals: Hospital[]; selectedHospitalId?: string; ambulanceLocation?: Coordinates; routeCoordinates?: RoutePoint[] }) {
  const selected = hospitals.find((item) => item.id === selectedHospitalId) ?? hospitals[0];
  const route = routeCoordinates?.length ? routeCoordinates : selected ? [
    { latitude: location.latitude, longitude: location.longitude },
    { latitude: selected.location.latitude, longitude: selected.location.longitude },
  ] : [];
  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      showsUserLocation
      showsMyLocationButton
      initialRegion={{ latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
    >
      <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }} title="Your live location" pinColor="#C82E38" />
      {hospitals.map((hospital) => (
        <Marker key={hospital.id} coordinate={{ latitude: hospital.location.latitude, longitude: hospital.location.longitude }} title={hospital.name} description={`${hospital.readiness.toUpperCase()} · ICU ${hospital.beds.icu}`} pinColor={hospital.id === selectedHospitalId ? "#0B78C6" : hospital.readiness === "ready" ? "#1E7A52" : "#A86A00"} />
      ))}
      {ambulanceLocation && <Marker coordinate={{ latitude: ambulanceLocation.latitude, longitude: ambulanceLocation.longitude }} title="Ambulance" description="Live simulated position" pinColor="#A86A00" />}
      {route.length > 1 && <Polyline coordinates={route} strokeColor="#0B78C6" strokeWidth={5} />}
    </MapView>
  );
}

const styles = StyleSheet.create({ map: { flex: 1 } });
