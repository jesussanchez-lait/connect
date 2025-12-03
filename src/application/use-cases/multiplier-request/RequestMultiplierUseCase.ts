import { IMultiplierRequestRepository } from "@/src/domain/repositories/IMultiplierRequestRepository";
import { MultiplierRequest } from "@/src/domain/entities/MultiplierRequest";

export interface RequestMultiplierInput {
  userId: string;
  userName: string;
  userPhoneNumber: string;
  campaignId: string;
  campaignName?: string;
}

export class RequestMultiplierUseCase {
  constructor(
    private multiplierRequestRepository: IMultiplierRequestRepository
  ) {}

  async execute(input: RequestMultiplierInput): Promise<MultiplierRequest> {
    // Verificar si ya existe una solicitud pendiente
    const existingRequest = await this.multiplierRequestRepository.findByUserId(
      input.userId,
      input.campaignId
    );

    if (existingRequest && existingRequest.status === "pending") {
      throw new Error("Ya tienes una solicitud pendiente de multiplicador");
    }

    if (existingRequest && existingRequest.status === "approved") {
      throw new Error("Ya eres multiplicador en esta campaña");
    }

    // Crear nueva solicitud
    const request = await this.multiplierRequestRepository.create({
      userId: input.userId,
      userName: input.userName,
      userPhoneNumber: input.userPhoneNumber,
      campaignId: input.campaignId,
      campaignName: input.campaignName,
      status: "pending",
    });

    return request;
  }
}
