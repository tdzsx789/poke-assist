import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerAnalysis } from '../entities/player-analysis.entity';
import { PlayerPattern } from '../entities/player-pattern.entity';
import { PlayerAnalysisController } from './player-analysis.controller';
import { PlayerAnalysisService } from './player-analysis.service';

@Module({
  imports: [TypeOrmModule.forFeature([PlayerAnalysis, PlayerPattern])],
  controllers: [PlayerAnalysisController],
  providers: [PlayerAnalysisService],
})
export class PlayerAnalysisModule {}
