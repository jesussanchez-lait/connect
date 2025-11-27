import { IAuthRepository } from '@/src/domain/repositories/IAuthRepository';
import { User } from '@/src/domain/entities/User';

export class GetCurrentUserUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(): Promise<User | null> {
    return this.authRepository.getCurrentUser();
  }
}

