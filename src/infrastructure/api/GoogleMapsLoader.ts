import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

let isConfigured = false;
let loadPromise: Promise<typeof google> | null = null;

/**
 * Loads Google Maps JavaScript API using the new API loader
 * This replaces the legacy script tag approach
 */
export async function loadGoogleMaps(): Promise<typeof google> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error(
      "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured in environment variables"
    );
  }

  // Return existing promise if already loading
  if (loadPromise) {
    return loadPromise;
  }

  // Return existing instance if already loaded
  if (typeof window !== "undefined" && window.google) {
    return Promise.resolve(window.google);
  }

  // Configure the API options (only once)
  if (!isConfigured) {
    setOptions({
      key: apiKey,
      v: "weekly",
    });
    isConfigured = true;
  }

  // Load the core library first, then places library
  // This will trigger the actual API load
  loadPromise = importLibrary("core")
    .then(() => {
      // Also load places library for autocomplete functionality
      return importLibrary("places");
    })
    .then((placesLibrary) => {
      if (typeof window === "undefined" || !window.google) {
        throw new Error("Google Maps API failed to load");
      }
      // Verify places library is loaded
      if (!window.google.maps?.places) {
        throw new Error("Places library failed to load");
      }
      return window.google;
    })
    .catch((error: unknown) => {
      // Reset promise on error so we can retry
      loadPromise = null;
      isConfigured = false;
      throw error;
    });

  return loadPromise;
}

/**
 * Checks if Google Maps is already loaded
 */
export function isGoogleMapsLoaded(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.google !== "undefined" &&
    typeof window.google.maps !== "undefined"
  );
}
