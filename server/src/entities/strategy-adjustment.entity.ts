import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Player } from './player.entity';
import { User } from './user.entity';
import { Street } from './action.entity';
import { ActionType } from './action.entity';

@Entity('strategy_adjustments')
export class StrategyAdjustment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'player_id' })
  @Index()
  playerId: string;

  @ManyToOne(() => Player, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player: Player;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: Street,
  })
  adjustmentType: Street;

  @Column({
    type: 'enum',
    enum: ActionType,
  })
  adjustmentScope: ActionType;

  @Column({ name: 'original_strategy', type: 'text' })
  originalStrategy: string;

  @Column({ name: 'adjusted_strategy', type: 'text' })
  adjustedStrategy: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({ name: 'expected_ev_improvement', type: 'decimal', precision: 10, scale: 2, nullable: true })
  expectedEvImprovement: number;

  @Column({ name: 'confidence_level', type: 'decimal', precision: 5, scale: 2, nullable: true })
  confidenceLevel: number;

  @Column({ name: 'is_active', default: true })
  @Index()
  isActive: boolean;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
