import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Player } from './player.entity';
import { User } from './user.entity';
import { Position } from './hand-player.entity';

export enum PatternType {
  PREFLOP_OPEN = 'PREFLOP_OPEN',
  CBET = 'CBET',
  CHECK_RAISE = 'CHECK_RAISE',
  RIVER_ALLIN = 'RIVER_ALLIN',
  THREE_BET = '3BET',
  FOUR_BET = '4BET',
  FLOAT = 'FLOAT',
  SLOW_PLAY = 'SLOW_PLAY',
}

@Entity('player_patterns')
export class PlayerPattern {
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
    enum: PatternType,
  })
  @Index()
  patternType: PatternType;

  @Column({
    type: 'enum',
    enum: Position,
    nullable: true,
  })
  @Index()
  position: Position;

  @Column({ name: 'board_texture', length: 50, nullable: true })
  boardTexture: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  frequency: number;

  @Column({ name: 'average_size', type: 'decimal', precision: 10, scale: 2, nullable: true })
  averageSize: number;

  @Column({ name: 'success_rate', type: 'decimal', precision: 5, scale: 2, nullable: true })
  successRate: number;

  @Column({ name: 'sample_size', default: 0 })
  sampleSize: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
