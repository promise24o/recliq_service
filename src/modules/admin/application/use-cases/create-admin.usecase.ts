import { Injectable, ConflictException, Inject } from '@nestjs/common';
import type { IAuthRepository } from '../../../auth/domain/repositories/auth.repository';
import { User } from '../../../auth/domain/entities/user.entity';
import { Email } from '../../../auth/domain/value-objects/email.vo';
import { UserRole } from '../../../../shared/constants/roles';
import { AdminSubRole } from '../../../../shared/constants/admin-sub-roles';
import type { PasswordService } from '../../../auth/infrastructure/security/password.service';
import type { EmailQueueService } from '../../../../shared/email/queue/email-queue.service';
import { EmailPriority } from '../../../../shared/email/queue/email-job.interface';

@Injectable()
export class CreateAdminUseCase {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
    @Inject('PasswordService')
    private readonly passwordService: PasswordService,
    @Inject('EmailQueueService')
    private readonly emailQueueService: EmailQueueService,
  ) {}

  async execute(data: {
    name: string;
    email: string;
    password: string;
    adminSubRole: AdminSubRole;
  }) {
    const emailVO = Email.create(data.email);
    
    const existingUser = await this.authRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('Admin with this email already exists');
    }

    const user = new User(
      null as any,
      data.name,
      emailVO,
      undefined,
      UserRole.ADMIN,
      data.adminSubRole,
      true,
    );

    await user.setPassword(data.password, this.passwordService);

    const savedUser = await this.authRepository.save(user);

    // Send welcome email with credentials
    await this.emailQueueService.addEmailJob({
      to: savedUser.email?.getValue() || data.email,
      subject: 'Welcome to Recliq - Admin Account Created',
      template: 'admin-welcome',
      payload: {
        name: savedUser.name,
        email: data.email,
        password: data.password,
        adminSubRole: data.adminSubRole,
      },
      priority: EmailPriority.HIGH,
      idempotencyKey: `admin-welcome-${savedUser.id}-${Date.now()}`,
      retryCount: 0,
      createdAt: new Date(),
    });

    return {
      id: savedUser.id,
      name: savedUser.name,
      email: savedUser.email?.getValue(),
      role: savedUser.role,
      adminSubRole: savedUser.adminSubRole,
      status: 'active',
      createdAt: savedUser.createdAt,
    };
  }
}
