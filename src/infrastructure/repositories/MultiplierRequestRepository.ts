import { IMultiplierRequestRepository } from "@/src/domain/repositories/IMultiplierRequestRepository";
import { MultiplierRequest } from "@/src/domain/entities/MultiplierRequest";
import { ApiClient } from "../api/ApiClient";

export class MultiplierRequestRepository
  implements IMultiplierRequestRepository
{
  constructor(private apiClient: ApiClient) {}

  async create(
    request: Omit<MultiplierRequest, "id" | "requestedAt">
  ): Promise<MultiplierRequest> {
    const response = await this.apiClient.post<MultiplierRequest>(
      "/dashboard/multiplier-request",
      request
    );
    return {
      ...response,
      requestedAt: new Date(response.requestedAt),
      reviewedAt: response.reviewedAt
        ? new Date(response.reviewedAt)
        : undefined,
    };
  }

  async findByUserId(
    userId: string,
    campaignId: string
  ): Promise<MultiplierRequest | null> {
    try {
      const response = await this.apiClient.get<MultiplierRequest>(
        `/dashboard/multiplier-request?userId=${userId}&campaignId=${campaignId}`
      );
      return {
        ...response,
        requestedAt: new Date(response.requestedAt),
        reviewedAt: response.reviewedAt
          ? new Date(response.reviewedAt)
          : undefined,
      };
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async findByCampaignId(
    campaignId: string,
    reviewerId?: string
  ): Promise<MultiplierRequest[]> {
    const params = new URLSearchParams({ campaignId });
    if (reviewerId) {
      params.append("reviewerId", reviewerId);
    }

    const response = await this.apiClient.get<MultiplierRequest[]>(
      `/dashboard/multiplier-requests?${params.toString()}`
    );

    return response.map((request) => ({
      ...request,
      requestedAt: new Date(request.requestedAt),
      reviewedAt: request.reviewedAt ? new Date(request.reviewedAt) : undefined,
    }));
  }

  async findById(id: string): Promise<MultiplierRequest | null> {
    try {
      const response = await this.apiClient.get<MultiplierRequest>(
        `/dashboard/multiplier-requests/${id}`
      );
      return {
        ...response,
        requestedAt: new Date(response.requestedAt),
        reviewedAt: response.reviewedAt
          ? new Date(response.reviewedAt)
          : undefined,
      };
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async update(
    id: string,
    updates: Partial<MultiplierRequest>
  ): Promise<MultiplierRequest> {
    const response = await this.apiClient.put<MultiplierRequest>(
      `/dashboard/multiplier-requests/${id}`,
      updates
    );
    return {
      ...response,
      requestedAt: new Date(response.requestedAt),
      reviewedAt: response.reviewedAt
        ? new Date(response.reviewedAt)
        : undefined,
    };
  }
}
