import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Hand } from './hand.entity';
import { Player } from './player.entity';

export enum Street {
  PREFLOP = 'PREFLOP',
  FLOP = 'FLOP',
  TURN = 'TURN',
  RIVER = 'RIVER',
}

export enum ActionType {
  OPEN = 'OPEN',
  CALL = 'CALL',
  RAISE = 'RAISE',
  THREE_BET = '3BET',
  FOUR_BET = '4BET',
  CHECK = 'CHECK',
  BET = 'BET',
  FOLD = 'FOLD',
  ALLIN = 'ALLIN',
}

export enum SizeUnit {
  BB = 'BB',
  PERCENT = 'PERCENT',
  ABSOLUTE = 'ABSOLUTE',
}

@Entity('actions')
export class Action {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'hand_id' })
  @Index()
  handId: string;

  @ManyToOne(() => Hand, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hand_id' })
  hand: Hand;

  @Column({ name: 'player_id' })
  @Index()
  playerId: string;

  @ManyToOne(() => Player, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player: Player;

  @Column({
    type: 'enum',
    enum: Street,
  })
  @Index()
  street: Street;

  @Column({
    type: 'enum',
    enum: ActionType,
  })
  actionType: ActionType;

  @Column({ name: 'action_size', type: 'decimal', precision: 10, scale: 2, nullable: true })
  actionSize: number;

  @Column({
    type: 'enum',
    enum: SizeUnit,
    default: SizeUnit.BB,
  })
  sizeUnit: SizeUnit;

  @Column({ name: 'action_order' })
  actionOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
