"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ApiClient } from "@/src/infrastructure/api/ApiClient";

interface Campaign {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: string;
  participants: number;
  createdAt: Date;
}

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
  const apiClient = new ApiClient();

  const fetchCampaigns = async () => {
    try {
      const data = await apiClient.get<Campaign[]>("/dashboard/campaigns");
      const campaignsWithDates = data.map((campaign) => ({
        ...campaign,
        startDate: new Date(campaign.startDate),
        endDate: new Date(campaign.endDate),
        createdAt: new Date(campaign.createdAt),
      }));
      setCampaigns(campaignsWithDates);

      // Auto-select first campaign if available and none selected
      if (campaignsWithDates.length > 0 && !selectedCampaign) {
        setSelectedCampaign(campaignsWithDates[0]);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
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
