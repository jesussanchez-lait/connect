import { IAuthRepository } from "@/src/domain/repositories/IAuthRepository";

export class VerifyIdentityUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(userId: string): Promise<{ workflowId: string }> {
    return this.authRepository.verifyIdentity(userId);
  }
}

