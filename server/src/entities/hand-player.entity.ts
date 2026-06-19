import { Entity, Column, PrimaryColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Hand } from './hand.entity';
import { Player } from './player.entity';

export enum Position {
  UTG = 'UTG',
  MP = 'MP',
  CO = 'CO',
  BTN = 'BTN',
  SB = 'SB',
  BB = 'BB',
}

@Entity('hand_players')
export class HandPlayer {
  @PrimaryColumn({ name: 'hand_id' })
  handId: string;

  @PrimaryColumn({ name: 'player_id' })
  playerId: string;

  @ManyToOne(() => Hand, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hand_id' })
  hand: Hand;

  @ManyToOne(() => Player, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player: Player;

  @Column({
    type: 'enum',
    enum: Position,
  })
  position: Position;

  @Column({ name: 'is_hero', default: false })
  isHero: boolean;

  @Column({ name: 'starting_stack', type: 'decimal', precision: 10, scale: 2 })
  startingStack: number;

  @Column({ name: 'hole_cards', length: 10, nullable: true })
  holeCards: string;
}
