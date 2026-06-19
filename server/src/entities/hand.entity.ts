import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum GameType {
  TOURNAMENT = 'TOURNAMENT',
  CASH = 'CASH',
}

export enum TournamentStage {
  FT = 'FT',
  ITM = 'ITM',
  BUBBLE = 'BUBBLE',
  EARLY = 'EARLY',
}

@Entity('hands')
export class Hand {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: GameType,
  })
  @Index()
  gameType: GameType;

  @Column({
    type: 'enum',
    enum: TournamentStage,
    nullable: true,
  })
  @Index()
  tournamentStage: TournamentStage;

  @Column({ name: 'blind_level', length: 50 })
  blindLevel: string;

  @Column({ name: 'effective_stack', type: 'decimal', precision: 10, scale: 2 })
  effectiveStack: number;

  @Column({ name: 'board_flop', length: 20 })
  boardFlop: string;

  @Column({ name: 'board_turn', length: 10, nullable: true })
  boardTurn: string;

  @Column({ name: 'board_river', length: 10, nullable: true })
  boardRiver: string;

  @Column({ name: 'overall_gto_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  overallGtoScore: number;

  @Column({ name: 'overall_suggestion', type: 'text', nullable: true })
  overallSuggestion: string;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
