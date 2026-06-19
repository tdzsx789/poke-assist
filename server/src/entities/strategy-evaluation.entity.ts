import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { StrategyAdjustment } from './strategy-adjustment.entity';
import { Hand } from './hand.entity';

export enum Outcome {
  WIN = 'WIN',
  LOSS = 'LOSS',
  DRAW = 'DRAW',
}

@Entity('strategy_evaluations')
export class StrategyEvaluation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'adjustment_id' })
  @Index()
  adjustmentId: string;

  @ManyToOne(() => StrategyAdjustment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'adjustment_id' })
  adjustment: StrategyAdjustment;

  @Column({ name: 'hand_id' })
  @Index()
  handId: string;

  @ManyToOne(() => Hand, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hand_id' })
  hand: Hand;

  @Column({ name: 'actual_ev', type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualEv: number;

  @Column({ name: 'expected_ev', type: 'decimal', precision: 10, scale: 2, nullable: true })
  expectedEv: number;

  @Column({ name: 'ev_difference', type: 'decimal', precision: 10, scale: 2, nullable: true })
  evDifference: number;

  @Column({
    type: 'enum',
    enum: Outcome,
  })
  outcome: Outcome;

  @Column({ name: 'was_adjustment_applied' })
  wasAdjustmentApplied: boolean;

  @Column({ name: 'effectiveness_rating', nullable: true })
  effectivenessRating: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
