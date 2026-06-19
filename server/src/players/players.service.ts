import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from '../entities/player.entity';
import { PlayerType } from '../entities/user.entity';

@Injectable()
export class PlayerService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
  ) {}

  async createPlayer(name: string, playerType: PlayerType = PlayerType.UNKNOWN, rangeNotes?: string) {
    const player = this.playerRepository.create({
      name,
      playerType,
      rangeNotes,
    });

    return this.playerRepository.save(player);
  }

  async getPlayerById(id: string) {
    const player = await this.playerRepository.findOne({
      where: { id },
    });

    if (!player) {
      throw new NotFoundException('玩家不存在');
    }

    return player;
  }

  async getPlayersByName(name: string) {
    return this.playerRepository.find({
      where: { name },
    });
  }

  async getAllPlayers() {
    return this.playerRepository.find();
  }

  async updatePlayer(id: string, updates: Partial<Player>) {
    const player = await this.getPlayerById(id);
    Object.assign(player, updates);
    return this.playerRepository.save(player);
  }

  async deletePlayer(id: string) {
    const player = await this.getPlayerById(id);
    return this.playerRepository.remove(player);
  }
}
