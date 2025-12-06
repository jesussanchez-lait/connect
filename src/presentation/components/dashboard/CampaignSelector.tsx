"use client";

import { useCampaign } from "@/src/presentation/contexts/CampaignContext";
import { useRole } from "@/src/presentation/hooks/useRole";
import { ROLES } from "@/src/presentation/contexts/RoleContext";

export function CampaignSelector() {
  const {
    campaigns,
    selectedCampaign,
    selectedCampaigns,
    setSelectedCampaign,
    toggleCampaignSelection,
    loading,
  } = useCampaign();
  const { role } = useRole();

  // Solo permitir selección múltiple para ADMIN y SUPER_ADMIN
  const allowMultipleSelection =
    role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;

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

  // Si no permite selección múltiple, usar el selector simple
  if (!allowMultipleSelection) {
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

  // Selector múltiple con checkboxes para ADMIN/SUPER_ADMIN
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Seleccionar Campañas ({selectedCampaigns.length} seleccionadas)
      </label>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {campaigns.map((campaign) => {
          const isSelected = selectedCampaigns.some(
            (c) => c.id === campaign.id
          );
          return (
            <label
              key={campaign.id}
              className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleCampaignSelection(campaign.id)}
                className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {campaign.name}
                  </span>
                  <span
                    className={`ml-2 px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
                      campaign.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {campaign.status === "active" ? "Activa" : "Inactiva"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {campaign.participants} participantes
                </p>
                {campaign.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                    {campaign.description}
                  </p>
                )}
              </div>
            </label>
          );
        })}
      </div>
      {selectedCampaigns.length > 0 && (
        <p className="mt-3 text-xs text-gray-500">
          {selectedCampaigns.length === campaigns.length
            ? "Todas las campañas seleccionadas"
            : `${selectedCampaigns.length} de ${campaigns.length} campañas seleccionadas`}
        </p>
      )}
    </div>
  );
}
