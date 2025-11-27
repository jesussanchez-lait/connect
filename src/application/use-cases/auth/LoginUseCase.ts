import { IAuthRepository } from '@/src/domain/repositories/IAuthRepository';
import { LoginCredentials } from '@/src/domain/entities/AuthCredentials';
import { AuthUser } from '@/src/domain/entities/User';

export class LoginUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(credentials: LoginCredentials): Promise<AuthUser> {
    return this.authRepository.login(credentials);
  }
}

