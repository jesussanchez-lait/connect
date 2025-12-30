import { IAuthRepository } from "@/src/domain/repositories/IAuthRepository";

export class UpgradeToMultiplierUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(userId: string, preferredAuthMethod?: string): Promise<void> {
    return this.authRepository.upgradeFollowerToMultiplier(
      userId,
      preferredAuthMethod
    );
  }
}

