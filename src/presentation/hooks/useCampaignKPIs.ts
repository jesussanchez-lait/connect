import { useMemo } from "react";
import { Campaign } from "@/src/domain/entities/Campaign";
import { useCampaign } from "@/src/presentation/contexts/CampaignContext";
import { useCampaignUsers } from "./useCampaignUsers";
import { Gender } from "@/src/domain/entities/User";

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

  // Métricas de área geográfica
  areaTypeDistribution: {
    urban: number;
    rural: number;
    unknown: number;
  };
  areaTypePercentages: {
    urban: number;
    rural: number;
  };

  // Métricas de sexo
  genderDistribution: {
    male: number;
    female: number;
    other: number;
    preferNotToSay: number;
    unknown: number;
  };
  genderPercentages: {
    male: number;
    female: number;
    other: number;
    preferNotToSay: number;
  };

  // Métricas de profesión
  topProfessions: Array<{
    profession: string;
    count: number;
    percentage: number;
  }>;
}

/**
 * Hook para calcular KPIs basados en las campañas seleccionadas
 */
export function useCampaignKPIs(): CampaignKPIs {
  const { selectedCampaigns } = useCampaign();
  const { users } = useCampaignUsers(selectedCampaigns);

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
        areaTypeDistribution: {
          urban: 0,
          rural: 0,
          unknown: 0,
        },
        areaTypePercentages: {
          urban: 0,
          rural: 0,
        },
        genderDistribution: {
          male: 0,
          female: 0,
          other: 0,
          preferNotToSay: 0,
          unknown: 0,
        },
        genderPercentages: {
          male: 0,
          female: 0,
          other: 0,
          preferNotToSay: 0,
        },
        topProfessions: [],
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

    // Calcular distribución por área (URBAN/RURAL)
    const areaTypeDistribution = users.reduce(
      (acc, user) => {
        if (user.areaType === "URBAN") {
          acc.urban++;
        } else if (user.areaType === "RURAL") {
          acc.rural++;
        } else {
          acc.unknown++;
        }
        return acc;
      },
      { urban: 0, rural: 0, unknown: 0 }
    );

    const totalUsersWithAreaType =
      areaTypeDistribution.urban + areaTypeDistribution.rural;
    const areaTypePercentages = {
      urban:
        totalUsersWithAreaType > 0
          ? Math.round(
              (areaTypeDistribution.urban / totalUsersWithAreaType) * 100
            )
          : 0,
      rural:
        totalUsersWithAreaType > 0
          ? Math.round(
              (areaTypeDistribution.rural / totalUsersWithAreaType) * 100
            )
          : 0,
    };

    // Calcular distribución por capital
    const capitalCityDistribution = users.reduce(
      (acc, user) => {
        if (user.fromCapitalCity === true) {
          acc.fromCapital++;
        } else if (user.fromCapitalCity === false) {
          acc.notFromCapital++;
        } else {
          acc.unknown++;
        }
        return acc;
      },
      { fromCapital: 0, notFromCapital: 0, unknown: 0 }
    );

    // Calcular distribución por sexo
    const genderDistribution = users.reduce(
      (acc, user) => {
        if (user.gender === "MALE") {
          acc.male++;
        } else if (user.gender === "FEMALE") {
          acc.female++;
        } else if (user.gender === "OTHER") {
          acc.other++;
        } else if (user.gender === "PREFER_NOT_TO_SAY") {
          acc.preferNotToSay++;
        } else {
          acc.unknown++;
        }
        return acc;
      },
      { male: 0, female: 0, other: 0, preferNotToSay: 0, unknown: 0 }
    );

    const totalUsersWithGender =
      genderDistribution.male +
      genderDistribution.female +
      genderDistribution.other +
      genderDistribution.preferNotToSay;
    const genderPercentages = {
      male:
        totalUsersWithGender > 0
          ? Math.round((genderDistribution.male / totalUsersWithGender) * 100)
          : 0,
      female:
        totalUsersWithGender > 0
          ? Math.round((genderDistribution.female / totalUsersWithGender) * 100)
          : 0,
      other:
        totalUsersWithGender > 0
          ? Math.round((genderDistribution.other / totalUsersWithGender) * 100)
          : 0,
      preferNotToSay:
        totalUsersWithGender > 0
          ? Math.round(
              (genderDistribution.preferNotToSay / totalUsersWithGender) * 100
            )
          : 0,
    };

    // Calcular top profesiones
    const professionCounts = users.reduce((acc, user) => {
      if (user.profession && user.profession.trim() !== "") {
        const profession = user.profession.trim();
        acc[profession] = (acc[profession] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const totalUsersWithProfession = Object.values(professionCounts).reduce(
      (sum, count) => sum + count,
      0
    );

    const topProfessions = Object.entries(professionCounts)
      .map(([profession, count]) => ({
        profession,
        count,
        percentage:
          totalUsersWithProfession > 0
            ? Math.round((count / totalUsersWithProfession) * 100)
            : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 profesiones

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
      areaTypeDistribution,
      areaTypePercentages,
      genderDistribution,
      genderPercentages,
      topProfessions,
    };
  }, [selectedCampaigns, users]);

  return kpis;
}
