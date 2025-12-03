import { IMultiplierRequestRepository } from "@/src/domain/repositories/IMultiplierRequestRepository";
import { MultiplierRequest } from "@/src/domain/entities/MultiplierRequest";

export interface GetMultiplierRequestsInput {
  campaignId: string;
  reviewerId?: string;
}

export class GetMultiplierRequestsUseCase {
  constructor(
    private multiplierRequestRepository: IMultiplierRequestRepository
  ) {}

  async execute(
    input: GetMultiplierRequestsInput
  ): Promise<MultiplierRequest[]> {
    const requests = await this.multiplierRequestRepository.findByCampaignId(
      input.campaignId,
      input.reviewerId
    );

    // Filtrar solo solicitudes pendientes
    return requests.filter((request) => request.status === "pending");
  }
}
