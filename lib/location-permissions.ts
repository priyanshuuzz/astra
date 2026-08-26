export type LocationPermissionState = "granted" | "denied" | "restricted" | "services_disabled" | "unavailable" | "error";
export function classifyLocationPermission(status: string, canAskAgain: boolean): LocationPermissionState { if (status === "granted") return "granted"; return canAskAgain ? "denied" : "restricted"; }
