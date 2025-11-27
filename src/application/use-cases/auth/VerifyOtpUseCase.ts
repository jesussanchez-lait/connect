import { IAuthRepository } from "@/src/domain/repositories/IAuthRepository";
import { OtpVerification } from "@/src/domain/entities/AuthCredentials";
import { AuthUser } from "@/src/domain/entities/User";

export class VerifyOtpUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(verification: OtpVerification): Promise<AuthUser> {
    return this.authRepository.verifyOtp(verification);
  }
}
