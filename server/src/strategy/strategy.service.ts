import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StrategyAdjustment } from '../entities/strategy-adjustment.entity';
import { StrategyEvaluation, Outcome } from '../entities/strategy-evaluation.entity';
import { Street } from '../entities/action.entity';
import { ActionType } from '../entities/action.entity';

@Injectable()
export class StrategyService {
  constructor(
    @InjectRepository(StrategyAdjustment)
    private readonly strategyAdjustmentRepository: Repository<StrategyAdjustment>,
    @InjectRepository(StrategyEvaluation)
    private readonly strategyEvaluationRepository: Repository<StrategyEvaluation>,
  ) {}

  async createStrategyAdjustment(data: {
    playerId: string;
    userId: string;
    adjustmentType: Street;
    adjustmentScope: ActionType;
    originalStrategy: string;
    adjustedStrategy: string;
    reason: string;
    expectedEvImprovement?: number;
    confidenceLevel?: number;
  }) {
    const adjustment = this.strategyAdjustmentRepository.create({
      playerId: data.playerId,
      userId: data.userId,
      adjustmentType: data.adjustmentType,
      adjustmentScope: data.adjustmentScope,
      originalStrategy: data.originalStrategy,
      adjustedStrategy: data.adjustedStrategy,
      reason: data.reason,
      expectedEvImprovement: data.expectedEvImprovement,
      confidenceLevel: data.confidenceLevel,
    });
    return this.strategyAdjustmentRepository.save(adjustment);
  }

  async getStrategyAdjustments(playerId?: string, userId?: string) {
    const query = this.strategyAdjustmentRepository.createQueryBuilder('sa');
    
    if (playerId) {
      query.where('sa.playerId = :playerId', { playerId });
    }
    if (userId) {
      query.andWhere('sa.userId = :userId', { userId });
    }
    
    return query.getMany();
  }

  async updateStrategyAdjustment(id: string, updates: Partial<StrategyAdjustment>) {
    const adjustment = await this.strategyAdjustmentRepository.findOne({
      where: { id },
    });

    if (!adjustment) {
      return null;
    }

    Object.assign(adjustment, updates);
    return this.strategyAdjustmentRepository.save(adjustment);
  }

  async createStrategyEvaluation(data: {
    adjustmentId: string;
    handId: string;
    actualEv?: number;
    expectedEv?: number;
    outcome: Outcome;
    wasAdjustmentApplied: boolean;
    effectivenessRating?: number;
    notes?: string;
  }) {
    const evaluation = this.strategyEvaluationRepository.create({
      adjustmentId: data.adjustmentId,
      handId: data.handId,
      actualEv: data.actualEv,
      expectedEv: data.expectedEv,
      outcome: data.outcome,
      wasAdjustmentApplied: data.wasAdjustmentApplied,
      effectivenessRating: data.effectivenessRating,
      notes: data.notes,
    });
    
    if (data.actualEv && data.expectedEv) {
      evaluation.evDifference = data.actualEv - data.expectedEv;
    }

    return this.strategyEvaluationRepository.save(evaluation);
  }

  async getStrategyEvaluations(adjustmentId?: string) {
    const query = this.strategyEvaluationRepository.createQueryBuilder('se');
    
    if (adjustmentId) {
      query.where('se.adjustmentId = :adjustmentId', { adjustmentId });
    }
    
    return query.getMany();
  }

  async evaluateStrategyEffectiveness(adjustmentId: string) {
    const evaluations = await this.getStrategyEvaluations(adjustmentId);
    
    if (evaluations.length === 0) {
      return { adjustmentId, effectiveness: 0, sampleSize: 0 };
    }

    const totalEvDiff = evaluations.reduce((sum, e) => sum + (e.evDifference || 0), 0);
    const avgEffectiveness = totalEvDiff / evaluations.length;
    const winRate = evaluations.filter(e => e.outcome === Outcome.WIN).length / evaluations.length;

    return {
      adjustmentId,
      effectiveness: avgEffectiveness,
      sampleSize: evaluations.length,
      winRate: winRate * 100,
    };
  }
}
