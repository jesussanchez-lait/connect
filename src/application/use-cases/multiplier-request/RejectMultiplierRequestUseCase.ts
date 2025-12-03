import { IMultiplierRequestRepository } from "@/src/domain/repositories/IMultiplierRequestRepository";
import { MultiplierRequest } from "@/src/domain/entities/MultiplierRequest";

export interface RejectMultiplierRequestInput {
  requestId: string;
  reviewerId: string;
  reviewerName: string;
  rejectionReason?: string;
}

export class RejectMultiplierRequestUseCase {
  constructor(
    private multiplierRequestRepository: IMultiplierRequestRepository
  ) {}

  async execute(
    input: RejectMultiplierRequestInput
  ): Promise<MultiplierRequest> {
    const request = await this.multiplierRequestRepository.findById(
      input.requestId
    );

    if (!request) {
      throw new Error("Solicitud no encontrada");
    }

    if (request.status !== "pending") {
      throw new Error(
        `La solicitud ya fue ${
          request.status === "approved" ? "aprobada" : "rechazada"
        }`
      );
    }

    const updatedRequest = await this.multiplierRequestRepository.update(
      input.requestId,
      {
        status: "rejected",
        reviewedAt: new Date(),
        reviewedBy: input.reviewerId,
        reviewerName: input.reviewerName,
        rejectionReason: input.rejectionReason,
      }
    );

    return updatedRequest;
  }
}
