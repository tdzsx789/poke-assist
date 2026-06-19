import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Action } from './action.entity';

export enum AnalysisStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('action_analyses')
export class ActionAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'action_id' })
  @Index()
  actionId: string;

  @ManyToOne(() => Action, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'action_id' })
  action: Action;

  @Column({
    type: 'enum',
    enum: AnalysisStatus,
    default: AnalysisStatus.PENDING,
  })
  @Index()
  analysisStatus: AnalysisStatus;

  @Column({ name: 'ev_value', type: 'decimal', precision: 10, scale: 2, nullable: true })
  evValue: number;

  @Column({ name: 'gto_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  gtoScore: number;

  @Column({ name: 'optimal_action', length: 50, nullable: true })
  optimalAction: string;

  @Column({ type: 'text', nullable: true })
  suggestion: string;

  @Column({ name: 'range_analysis', type: 'text', nullable: true })
  rangeAnalysis: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
