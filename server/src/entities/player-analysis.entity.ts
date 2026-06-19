import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Player } from './player.entity';
import { User } from './user.entity';
import { PlayerType } from './user.entity';

@Entity('player_analysis')
export class PlayerAnalysis {
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

  @Column({ name: 'analyzed_hands_count', default: 0 })
  analyzedHandsCount: number;

  @Column({ name: 'preflop_open_freq', type: 'decimal', precision: 5, scale: 2, nullable: true })
  preflopOpenFreq: number;

  @Column({ name: 'preflop_3bet_freq', type: 'decimal', precision: 5, scale: 2, nullable: true })
  preflopThreeBetFreq: number;

  @Column({ name: 'preflop_call_freq', type: 'decimal', precision: 5, scale: 2, nullable: true })
  preflopCallFreq: number;

  @Column({ name: 'preflop_fold_freq', type: 'decimal', precision: 5, scale: 2, nullable: true })
  preflopFoldFreq: number;

  @Column({ name: 'flop_cbet_freq', type: 'decimal', precision: 5, scale: 2, nullable: true })
  flopCbetFreq: number;

  @Column({ name: 'flop_raise_freq', type: 'decimal', precision: 5, scale: 2, nullable: true })
  flopRaiseFreq: number;

  @Column({ name: 'turn_bet_freq', type: 'decimal', precision: 5, scale: 2, nullable: true })
  turnBetFreq: number;

  @Column({ name: 'river_bet_freq', type: 'decimal', precision: 5, scale: 2, nullable: true })
  riverBetFreq: number;

  @Column({
    type: 'enum',
    enum: PlayerType,
    nullable: true,
  })
  inferredType: PlayerType;

  @Column({ name: 'bluff_probability', type: 'decimal', precision: 5, scale: 2, nullable: true })
  bluffProbability: number;

  @Column({ name: 'value_bet_probability', type: 'decimal', precision: 5, scale: 2, nullable: true })
  valueBetProbability: number;

  @Column({ name: 'aggression_factor', type: 'decimal', precision: 5, scale: 2, nullable: true })
  aggressionFactor: number;

  @Column({ name: 'tightness_factor', type: 'decimal', precision: 5, scale: 2, nullable: true })
  tightnessFactor: number;

  @Column({ name: 'inferred_preflop_range', type: 'text', nullable: true })
  inferredPreflopRange: string;

  @Column({ name: 'inferred_postflop_range', type: 'text', nullable: true })
  inferredPostflopRange: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
