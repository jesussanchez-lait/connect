"use client";

import { useState, useEffect, useMemo } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { ApiClient } from "@/src/infrastructure/api/ApiClient";
import { useCampaign } from "@/src/presentation/contexts/CampaignContext";

interface TeamMember {
  id: string;
  name: string;
  phoneNumber: string;
  city: string;
  department: string;
  neighborhood: string;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
}

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 4.6097, // Bogotá
  lng: -74.0817,
};

export function TeamMap() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const apiClient = new ApiClient();
  const { selectedCampaign } = useCampaign();

  useEffect(() => {
    if (selectedCampaign) {
      fetchTeam();
    } else {
      setTeam([]);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampaign]);

  const fetchTeam = async () => {
    if (!selectedCampaign) return;

    setLoading(true);
    try {
      const data = await apiClient.get<TeamMember[]>(
        `/dashboard/my-team?campaignId=${selectedCampaign.id}`
      );
      setTeam(data.filter((member) => member.latitude && member.longitude));
    } catch (error) {
      console.error("Error fetching team:", error);
    } finally {
      setLoading(false);
    }
  };

  const mapCenter = useMemo(() => {
    if (team.length === 0) return defaultCenter;

    const validMembers = team.filter((m) => m.latitude && m.longitude) as Array<
      TeamMember & { latitude: number; longitude: number }
    >;

    if (validMembers.length === 0) return defaultCenter;

    const avgLat =
      validMembers.reduce((sum, m) => sum + m.latitude, 0) /
      validMembers.length;
    const avgLng =
      validMembers.reduce((sum, m) => sum + m.longitude, 0) /
      validMembers.length;

    return { lat: avgLat, lng: avgLng };
  }, [team]);

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Use the new API loader hook
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: googleMapsApiKey || "",
    libraries: ["maps"], // Only load maps library, not places (places is loaded separately in RegisterForm)
  });

  if (!googleMapsApiKey) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Mapa del Equipo
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
          Mapa del Equipo
        </h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">
            Error al cargar Google Maps: {loadError.message}
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const validMembers = team.filter((m) => m.latitude && m.longitude) as Array<
    TeamMember & { latitude: number; longitude: number }
  >;

  if (!selectedCampaign) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Mapa del Equipo
        </h3>
        <p className="text-gray-500 text-center py-8">
          Selecciona una campaña para ver el mapa
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Mapa del Equipo - {selectedCampaign.name} ({validMembers.length}{" "}
        ubicaciones)
      </h3>
      {validMembers.length === 0 ? (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <p className="text-gray-500">
            No hay ubicaciones disponibles para mostrar en el mapa
          </p>
        </div>
      ) : (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={validMembers.length === 1 ? 12 : 6}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
          }}
        >
          {validMembers.map((member) => (
            <Marker
              key={member.id}
              position={{
                lat: member.latitude,
                lng: member.longitude,
              }}
              title={`${member.name} - ${member.city}`}
              label={{
                text: member.name.charAt(0).toUpperCase(),
                color: "white",
                fontWeight: "bold",
              }}
            />
          ))}
        </GoogleMap>
      )}
    </div>
  );
}
