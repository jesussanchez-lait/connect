"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { FirebaseDataSource } from "@/src/infrastructure/firebase/FirebaseDataSource";
import { Campaign } from "@/src/domain/entities/Campaign";
import { useAuth } from "@/src/presentation/hooks/useAuth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/src/infrastructure/firebase";
import type { Unsubscribe } from "firebase/firestore";

interface CampaignContextType {
  campaigns: Campaign[];
  selectedCampaign: Campaign | null;
  setSelectedCampaign: (campaign: Campaign | null) => void;
  loading: boolean;
  refreshCampaigns: () => Promise<void>;
}

const CampaignContext = createContext<CampaignContextType | undefined>(
  undefined
);

export function CampaignProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const campaignDataSource = useMemo(
    () => new FirebaseDataSource<Campaign>("campaigns"),
    []
  );
  const userCampaignIdsRef = useRef<string[]>([]);

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);

      // Si no hay usuario, no cargar campañas
      if (!user) {
        setCampaigns([]);
        setSelectedCampaign(null);
        setLoading(false);
        return;
      }

      // Obtener los IDs de campañas del usuario
      const userCampaignIds = user.campaignIds || [];

      // Si no hay IDs, no hay campañas
      if (userCampaignIds.length === 0) {
        setCampaigns([]);
        setSelectedCampaign(null);
        setLoading(false);
        return;
      }

      // Traer solo las campañas específicas por sus IDs
      const userCampaigns = await campaignDataSource.getByIds(userCampaignIds);

      setCampaigns(userCampaigns);

      // Auto-select first campaign if available and none selected
      if (userCampaigns.length > 0 && !selectedCampaign) {
        setSelectedCampaign(userCampaigns[0]);
      } else if (userCampaigns.length === 0) {
        setSelectedCampaign(null);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  }, [user, selectedCampaign, campaignDataSource]);

  // Detectar cambios en campaignIds y recargar campañas automáticamente
  useEffect(() => {
    const previousIds = userCampaignIdsRef.current;
    const currentIds = user?.campaignIds || [];

    // Si los IDs cambiaron, necesitamos recargar las campañas
    const idsChanged =
      previousIds.length !== currentIds.length ||
      previousIds.some((id, index) => id !== currentIds[index]) ||
      currentIds.some((id, index) => id !== previousIds[index]);

    if (idsChanged) {
      // Actualizar la referencia
      userCampaignIdsRef.current = currentIds;

      // Si hay usuario y los IDs cambiaron, ejecutar fetchCampaigns
      if (user) {
        fetchCampaigns();
      }
    } else {
      // Actualizar la referencia incluso si no cambió (para mantener sincronizado)
      userCampaignIdsRef.current = currentIds;
    }
  }, [user?.campaignIds, user?.id, user, fetchCampaigns]);

  // Subscribe to real-time updates for specific campaigns
  useEffect(() => {
    // No suscribirse si no hay usuario
    if (!user || authLoading || !db) {
      return;
    }

    const currentUserCampaignIds = userCampaignIdsRef.current;

    // Si no hay IDs de campañas, limpiar y no suscribirse
    if (!currentUserCampaignIds || currentUserCampaignIds.length === 0) {
      setCampaigns([]);
      setSelectedCampaign(null);
      setLoading(false);
      return;
    }

    // Suscribirse a cada campaña específica del usuario individualmente
    const unsubscribes: Unsubscribe[] = [];
    const campaignMap = new Map<string, Campaign>();

    const updateCampaigns = () => {
      // Filtrar solo las que están en la lista actual del usuario
      const currentIds = userCampaignIdsRef.current;
      const filtered = Array.from(campaignMap.values()).filter((camp) =>
        currentIds.includes(camp.id)
      );

      setCampaigns(filtered);

      // Auto-select first campaign if available and none selected
      if (filtered.length > 0 && !selectedCampaign) {
        setSelectedCampaign(filtered[0]);
      } else if (filtered.length === 0) {
        setSelectedCampaign(null);
      }
    };

    // Suscribirse a cada documento individualmente
    currentUserCampaignIds.forEach((campaignId) => {
      if (!db) return;

      const docRef = doc(db, "campaigns", campaignId);

      const unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const campaign: Campaign = {
              id: docSnap.id,
              name: data.name,
              description: data.description,
              startDate: data.startDate?.toDate() || new Date(),
              endDate: data.endDate?.toDate() || new Date(),
              status: data.status || "active",
              participants: data.participants || 0,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate(),
            };
            campaignMap.set(campaign.id, campaign);
          } else {
            // Si el documento fue eliminado, removerlo del mapa
            campaignMap.delete(campaignId);
          }

          updateCampaigns();
        },
        (error) => {
          console.error(`Error subscribing to campaign ${campaignId}:`, error);
        }
      );

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.campaignIds?.join(","), authLoading]);

  // Cargar campañas cuando el usuario cambie inicialmente
  useEffect(() => {
    if (!authLoading && user) {
      // Solo cargar si aún no tenemos campañas o si es la primera vez
      if (campaigns.length === 0) {
        fetchCampaigns();
      }
    } else if (!authLoading && !user) {
      setCampaigns([]);
      setSelectedCampaign(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  // Update selected campaign when campaigns change
  useEffect(() => {
    if (campaigns.length > 0 && !selectedCampaign) {
      setSelectedCampaign(campaigns[0]);
    } else if (campaigns.length === 0) {
      setSelectedCampaign(null);
    }
  }, [campaigns, selectedCampaign]);

  return (
    <CampaignContext.Provider
      value={{
        campaigns,
        selectedCampaign,
        setSelectedCampaign,
        loading,
        refreshCampaigns: fetchCampaigns,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error("useCampaign must be used within a CampaignProvider");
  }
  return context;
}
