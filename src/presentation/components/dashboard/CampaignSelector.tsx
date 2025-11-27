"use client";

import { useCampaign } from "@/src/presentation/contexts/CampaignContext";

export function CampaignSelector() {
  const { campaigns, selectedCampaign, setSelectedCampaign, loading } =
    useCampaign();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-500">
          No tienes campañas activas disponibles
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <label
        htmlFor="campaign-select"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Seleccionar Campaña
      </label>
      <select
        id="campaign-select"
        value={selectedCampaign?.id || ""}
        onChange={(e) => {
          const campaign = campaigns.find((c) => c.id === e.target.value);
          setSelectedCampaign(campaign || null);
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
      >
        {campaigns.map((campaign) => (
          <option key={campaign.id} value={campaign.id}>
            {campaign.name} ({campaign.participants} participantes)
          </option>
        ))}
      </select>
      {selectedCampaign && (
        <p className="mt-2 text-xs text-gray-500">
          {selectedCampaign.description}
        </p>
      )}
    </div>
  );
}
