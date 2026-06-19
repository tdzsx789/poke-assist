import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hand } from '../entities/hand.entity';
import { HandController } from './hands.controller';
import { HandService } from './hands.service';

@Module({
  imports: [TypeOrmModule.forFeature([Hand])],
  controllers: [HandController],
  providers: [HandService],
})
export class HandsModule {}
