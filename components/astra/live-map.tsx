import { Platform } from "react-native";
import type { Coordinates, Hospital } from "@/types/astra";
import type { RoutePoint } from "@/lib/routing-service";
import type { ReactElement } from "react";

type Props = { location: Coordinates; hospitals: Hospital[]; selectedHospitalId?: string; ambulanceLocation?: Coordinates; routeCoordinates?: RoutePoint[] };

export function LiveMap(props: Props) {
  if (Platform.OS === "web") {
    const { LiveMap: WebLiveMap } = require("./live-map.web") as { LiveMap: (props: Props) => ReactElement };
    return <WebLiveMap {...props} />;
  }
  const { LiveMap: NativeLiveMap } = require("./live-map.native") as { LiveMap: (props: Props) => ReactElement };
  return <NativeLiveMap {...props} />;
}
