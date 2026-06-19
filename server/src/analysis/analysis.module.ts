import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionAnalysis } from '../entities/action-analysis.entity';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';

@Module({
  imports: [TypeOrmModule.forFeature([ActionAnalysis])],
  controllers: [AnalysisController],
  providers: [AnalysisService],
})
export class AnalysisModule {}
