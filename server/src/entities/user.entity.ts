import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PlayerType {
  TIGHT_AGGRESSIVE = 'TIGHT_AGGRESSIVE',
  LOOSE_AGGRESSIVE = 'LOOSE_AGGRESSIVE',
  TIGHT_PASSIVE = 'TIGHT_PASSIVE',
  LOOSE_PASSIVE = 'LOOSE_PASSIVE',
  GTO = 'GTO',
  UNKNOWN = 'UNKNOWN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
