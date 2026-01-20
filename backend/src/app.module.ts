import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RoomsModule } from './rooms/rooms.module';
import { AuthModule } from './auth/auth.module';
import { SignalingGateway } from './signaling/signaling.gateway';

@Module({
  imports: [RoomsModule, AuthModule],
  controllers: [AppController],
  providers: [AppService, SignalingGateway],
})
export class AppModule {}
