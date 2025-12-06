"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { FirebaseDataSource } from "@/src/infrastructure/firebase/FirebaseDataSource";
import { Campaign } from "@/src/domain/entities/Campaign";

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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const campaignDataSource = new FirebaseDataSource<Campaign>("campaigns");

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await campaignDataSource.getAll();
      setCampaigns(data);

      // Auto-select first campaign if available and none selected
      if (data.length > 0 && !selectedCampaign) {
        setSelectedCampaign(data[0]);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = campaignDataSource.subscribeToCollection(
      (updatedCampaigns) => {
        setCampaigns(updatedCampaigns);

        // Auto-select first campaign if available and none selected
        if (updatedCampaigns.length > 0 && !selectedCampaign) {
          setSelectedCampaign(updatedCampaigns[0]);
        }
      }
    );

    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update selected campaign when campaigns change
  useEffect(() => {
    if (campaigns.length > 0 && !selectedCampaign) {
      setSelectedCampaign(campaigns[0]);
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
