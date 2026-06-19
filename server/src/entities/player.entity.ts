import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { PlayerType } from './user.entity';

@Entity('players')
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  name: string;

  @Column({
    type: 'enum',
    enum: PlayerType,
    default: PlayerType.UNKNOWN,
  })
  @Index()
  playerType: PlayerType;

  @Column({ name: 'range_notes', type: 'text', nullable: true })
  rangeNotes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
