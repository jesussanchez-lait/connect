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
  selectedCampaigns: Campaign[];
  setSelectedCampaign: (campaign: Campaign | null) => void;
  setSelectedCampaigns: (campaigns: Campaign[]) => void;
  toggleCampaignSelection: (campaignId: string) => void;
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
  const [selectedCampaigns, setSelectedCampaigns] = useState<Campaign[]>([]);
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
        setSelectedCampaigns([userCampaigns[0]]);
      } else if (userCampaigns.length === 0) {
        setSelectedCampaign(null);
        setSelectedCampaigns([]);
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

      // Actualizar selectedCampaigns con las versiones actualizadas de las campañas seleccionadas
      setSelectedCampaigns((prev) =>
        prev
          .map((selectedCamp) => {
            const updated = filtered.find((c) => c.id === selectedCamp.id);
            return updated || selectedCamp;
          })
          .filter((camp) => currentIds.includes(camp.id))
      );

      // Auto-select first campaign if available and none selected
      if (filtered.length > 0 && !selectedCampaign) {
        setSelectedCampaign(filtered[0]);
        setSelectedCampaigns([filtered[0]]);
      } else if (filtered.length === 0) {
        setSelectedCampaign(null);
        setSelectedCampaigns([]);
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
            const previousCampaign = campaignMap.get(campaignId);
            const previousParticipants = previousCampaign?.participants || 0;
            
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
            
            // Log cuando cambia el número de participantes
            if (previousCampaign && previousParticipants !== campaign.participants) {
              console.log(
                `📊 [CampaignContext] Campaña ${campaignId} - Participants actualizado: ${previousParticipants} → ${campaign.participants}`
              );
            }
            
            campaignMap.set(campaign.id, campaign);
          } else {
            // Si el documento fue eliminado, removerlo del mapa
            campaignMap.delete(campaignId);
            console.warn(
              `⚠️ [CampaignContext] Campaña ${campaignId} fue eliminada de Firestore`
            );
          }

          updateCampaigns();
        },
        (error) => {
          console.error(
            `❌ [CampaignContext] Error subscribing to campaign ${campaignId}:`,
            error
          );
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

  // Update selected campaign when campaigns change (solo para auto-selección inicial)
  useEffect(() => {
    if (campaigns.length > 0 && !selectedCampaign) {
      setSelectedCampaign(campaigns[0]);
      setSelectedCampaigns([campaigns[0]]);
    } else if (campaigns.length === 0) {
      setSelectedCampaign(null);
      setSelectedCampaigns([]);
    }
    // No actualizar selectedCampaign si ya existe - el stream se encargará de eso
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaigns.length]);

  // Función para alternar la selección de una campaña
  const toggleCampaignSelection = useCallback(
    (campaignId: string) => {
      setSelectedCampaigns((prev) => {
        const campaign = campaigns.find((c) => c.id === campaignId);
        if (!campaign) return prev;

        const isSelected = prev.some((c) => c.id === campaignId);
        if (isSelected) {
          // Deseleccionar
          const filtered = prev.filter((c) => c.id !== campaignId);
          // Si se deseleccionó la última, mantener al menos una si hay campañas disponibles
          if (filtered.length === 0 && campaigns.length > 0) {
            return [campaigns[0]];
          }
          return filtered;
        } else {
          // Seleccionar
          return [...prev, campaign];
        }
      });
    },
    [campaigns]
  );

  // Stream específico para la campaña seleccionada - actualiza en tiempo real
  useEffect(() => {
    // No suscribirse si no hay campaña seleccionada o no hay db
    if (!selectedCampaign?.id || !db) {
      return;
    }

    const campaignId = selectedCampaign.id;
    const docRef = doc(db, "campaigns", campaignId);

    console.log(
      `📡 [CampaignContext] Suscribiéndose al stream de campaña: ${campaignId}`
    );

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const updatedCampaign: Campaign = {
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

          console.log(
            `✅ [CampaignContext] Campaña ${campaignId} actualizada. Participants: ${updatedCampaign.participants}`
          );

          // Actualizar la campaña seleccionada con los datos más recientes
          setSelectedCampaign((prev) => {
            // Solo actualizar si realmente cambió algo para evitar re-renders innecesarios
            if (
              !prev ||
              prev.participants !== updatedCampaign.participants ||
              prev.name !== updatedCampaign.name ||
              prev.status !== updatedCampaign.status
            ) {
              return updatedCampaign;
            }
            return prev;
          });

          // También actualizar en la lista de campañas
          setCampaigns((prevCampaigns) =>
            prevCampaigns.map((camp) =>
              camp.id === campaignId ? updatedCampaign : camp
            )
          );

          // Actualizar también en selectedCampaigns si está seleccionada
          setSelectedCampaigns((prev) =>
            prev.map((camp) =>
              camp.id === campaignId ? updatedCampaign : camp
            )
          );
        } else {
          console.warn(
            `⚠️ [CampaignContext] Campaña ${campaignId} no existe en Firestore`
          );
          // Si la campaña fue eliminada, limpiar la selección
          setSelectedCampaign(null);
        }
      },
      (error) => {
        console.error(
          `❌ [CampaignContext] Error en stream de campaña ${campaignId}:`,
          error
        );
      }
    );

    // Cleanup: desuscribirse cuando cambie la campaña seleccionada o se desmonte el componente
    return () => {
      console.log(
        `🔌 [CampaignContext] Desuscribiéndose del stream de campaña: ${campaignId}`
      );
      unsubscribe();
    };
  }, [selectedCampaign?.id]);

  return (
    <CampaignContext.Provider
      value={{
        campaigns,
        selectedCampaign,
        selectedCampaigns,
        setSelectedCampaign,
        setSelectedCampaigns,
        toggleCampaignSelection,
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
