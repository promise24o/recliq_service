import { Module } from '@nestjs/common';
import { CoreConfigModule } from './core/config/config.module';
import { DatabaseModule } from './core/database/database.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [CoreConfigModule, DatabaseModule, AuthModule],
})
export class AppModule {}
