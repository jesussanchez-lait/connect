import { MultiplierRequest } from "../entities/MultiplierRequest";

export interface IMultiplierRequestRepository {
  create(
    request: Omit<MultiplierRequest, "id" | "requestedAt">
  ): Promise<MultiplierRequest>;
  findByUserId(
    userId: string,
    campaignId: string
  ): Promise<MultiplierRequest | null>;
  findByCampaignId(
    campaignId: string,
    reviewerId?: string
  ): Promise<MultiplierRequest[]>;
  findById(id: string): Promise<MultiplierRequest | null>;
  update(
    id: string,
    updates: Partial<MultiplierRequest>
  ): Promise<MultiplierRequest>;
}
