import { IAuthRepository } from "@/src/domain/repositories/IAuthRepository";
import {
  LoginCredentials,
  OtpResponse,
} from "@/src/domain/entities/AuthCredentials";

export class SendOtpUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(credentials: LoginCredentials): Promise<OtpResponse> {
    return this.authRepository.sendOtp(credentials);
  }
}
