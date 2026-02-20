import { User } from '../entities/user.entity';
import { UserRole } from '../../../../shared/constants/roles';

export interface IAuthRepository {
  findByEmail(email: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  findByReferralCode(referralCode: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByRole(role: UserRole): Promise<User[]>;
  save(user: User): Promise<User>;
  update(user: User): Promise<User>;
}