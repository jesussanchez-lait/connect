import { IAuthRepository } from "@/src/domain/repositories/IAuthRepository";

export class LogoutUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(): Promise<void> {
    return this.authRepository.logout();
  }
}
