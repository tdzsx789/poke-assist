import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StrategyAdjustment } from '../entities/strategy-adjustment.entity';
import { StrategyEvaluation } from '../entities/strategy-evaluation.entity';
import { StrategyController } from './strategy.controller';
import { StrategyService } from './strategy.service';

@Module({
  imports: [TypeOrmModule.forFeature([StrategyAdjustment, StrategyEvaluation])],
  controllers: [StrategyController],
  providers: [StrategyService],
})
export class StrategyModule {}
