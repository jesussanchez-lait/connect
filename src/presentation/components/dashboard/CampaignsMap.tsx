"use client";

import { useMemo, useRef, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { useCampaign } from "@/src/presentation/contexts/CampaignContext";
import { useCampaignUsers } from "@/src/presentation/hooks/useCampaignUsers";

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 4.6097, // Bogotá
  lng: -74.0817,
};

export function CampaignsMap() {
  const { selectedCampaigns } = useCampaign();
  const { users, loading } = useCampaignUsers(selectedCampaigns);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Filter users: only MULTIPLIER role with valid coordinates
  const validUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.role === "MULTIPLIER" && u.latitude != null && u.longitude != null
    ) as Array<(typeof users)[0] & { latitude: number; longitude: number }>;
  }, [users]);

  // Calculate bounding box for all multipliers
  const bounds = useMemo(() => {
    if (validUsers.length === 0) return null;

    let minLat = validUsers[0].latitude;
    let maxLat = validUsers[0].latitude;
    let minLng = validUsers[0].longitude;
    let maxLng = validUsers[0].longitude;

    validUsers.forEach((user) => {
      minLat = Math.min(minLat, user.latitude);
      maxLat = Math.max(maxLat, user.latitude);
      minLng = Math.min(minLng, user.longitude);
      maxLng = Math.max(maxLng, user.longitude);
    });

    return { minLat, maxLat, minLng, maxLng };
  }, [validUsers]);

  // Calculate center from bounding box
  const mapCenter = useMemo(() => {
    if (!bounds) return defaultCenter;

    return {
      lat: (bounds.minLat + bounds.maxLat) / 2,
      lng: (bounds.minLng + bounds.maxLng) / 2,
    };
  }, [bounds]);

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Use the new API loader hook
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: googleMapsApiKey || "",
    libraries: ["maps"], // Only load maps library, not places
  });

  // Fit bounds when validUsers change (after map is loaded)
  useEffect(() => {
    if (mapRef.current && isLoaded && validUsers.length > 0) {
      const googleBounds = new google.maps.LatLngBounds();
      validUsers.forEach((user) => {
        googleBounds.extend(
          new google.maps.LatLng(user.latitude, user.longitude)
        );
      });
      // Fit bounds with padding to avoid markers touching edges
      mapRef.current.fitBounds(googleBounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50,
      });
    }
  }, [validUsers, isLoaded]);

  if (!googleMapsApiKey) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Mapa de Multiplicadores
        </h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            Por favor configura NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en tu archivo
            .env.local
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Mapa de Multiplicadores
        </h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">
            Error al cargar Google Maps: {loadError.message}
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded || loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (selectedCampaigns.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Mapa de Multiplicadores
        </h3>
        <p className="text-gray-500 text-center py-8">
          Selecciona una o más campañas para ver el mapa
        </p>
      </div>
    );
  }

  const campaignsNames =
    selectedCampaigns.length === 1
      ? selectedCampaigns[0].name
      : `${selectedCampaigns.length} campañas`;

  return (
    <>
      {validUsers.length === 0 ? (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <p className="text-gray-500">
            No hay ubicaciones disponibles para mostrar en el mapa
          </p>
        </div>
      ) : (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={validUsers.length === 1 ? 12 : 6}
          onLoad={(map) => {
            mapRef.current = map;
          }}
          onUnmount={() => {
            mapRef.current = null;
          }}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
          }}
        >
          {validUsers.map((user) => (
            <Marker
              key={user.id}
              position={{
                lat: user.latitude,
                lng: user.longitude,
              }}
              title={`${user.name} - ${user.city || user.department || ""}`}
              label={{
                text: user.name.charAt(0).toUpperCase(),
                color: "white",
                fontWeight: "bold",
              }}
            />
          ))}
        </GoogleMap>
      )}
    </>
  );
}
