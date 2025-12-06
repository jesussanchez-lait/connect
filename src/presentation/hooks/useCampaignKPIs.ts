import { useMemo } from "react";
import { Campaign } from "@/src/domain/entities/Campaign";
import { useCampaign } from "@/src/presentation/contexts/CampaignContext";

export interface CampaignKPIs {
  // Métricas básicas
  totalCampaigns: number;
  totalParticipants: number;
  activeCampaigns: number;
  inactiveCampaigns: number;

  // Métricas de crecimiento (se pueden expandir)
  averageParticipantsPerCampaign: number;
  totalActiveParticipants: number;

  // Métricas de tiempo
  campaignsInProgress: number;
  campaignsCompleted: number;
  campaignsNotStarted: number;

  // Métricas agregadas por estado
  participantsByStatus: {
    active: number;
    inactive: number;
    completed: number;
  };
}

/**
 * Hook para calcular KPIs basados en las campañas seleccionadas
 */
export function useCampaignKPIs(): CampaignKPIs {
  const { selectedCampaigns } = useCampaign();

  const kpis = useMemo(() => {
    if (selectedCampaigns.length === 0) {
      return {
        totalCampaigns: 0,
        totalParticipants: 0,
        activeCampaigns: 0,
        inactiveCampaigns: 0,
        averageParticipantsPerCampaign: 0,
        totalActiveParticipants: 0,
        campaignsInProgress: 0,
        campaignsCompleted: 0,
        campaignsNotStarted: 0,
        participantsByStatus: {
          active: 0,
          inactive: 0,
          completed: 0,
        },
      };
    }

    const now = new Date();

    // Calcular métricas básicas
    const totalParticipants = selectedCampaigns.reduce(
      (sum, c) => sum + c.participants,
      0
    );

    const activeCampaigns = selectedCampaigns.filter(
      (c) => c.status === "active"
    ).length;

    const inactiveCampaigns = selectedCampaigns.filter(
      (c) => c.status === "inactive"
    ).length;

    const completedCampaigns = selectedCampaigns.filter(
      (c) => c.status === "completed"
    ).length;

    // Calcular campañas por estado temporal
    const campaignsInProgress = selectedCampaigns.filter((c) => {
      const startDate = new Date(c.startDate);
      const endDate = new Date(c.endDate);
      return now >= startDate && now <= endDate && c.status === "active";
    }).length;

    const campaignsNotStarted = selectedCampaigns.filter((c) => {
      const startDate = new Date(c.startDate);
      return now < startDate;
    }).length;

    // Calcular participantes por estado
    const participantsByStatus = selectedCampaigns.reduce(
      (acc, campaign) => {
        if (campaign.status === "active") {
          acc.active += campaign.participants;
        } else if (campaign.status === "inactive") {
          acc.inactive += campaign.participants;
        } else if (campaign.status === "completed") {
          acc.completed += campaign.participants;
        }
        return acc;
      },
      { active: 0, inactive: 0, completed: 0 }
    );

    // Calcular total de participantes activos (solo campañas activas)
    const totalActiveParticipants = participantsByStatus.active;

    // Calcular promedio de participantes por campaña
    const averageParticipantsPerCampaign =
      selectedCampaigns.length > 0
        ? totalParticipants / selectedCampaigns.length
        : 0;

    return {
      totalCampaigns: selectedCampaigns.length,
      totalParticipants,
      activeCampaigns,
      inactiveCampaigns,
      averageParticipantsPerCampaign:
        Math.round(averageParticipantsPerCampaign * 100) / 100,
      totalActiveParticipants,
      campaignsInProgress,
      campaignsCompleted: completedCampaigns,
      campaignsNotStarted,
      participantsByStatus,
    };
  }, [selectedCampaigns]);

  return kpis;
}
