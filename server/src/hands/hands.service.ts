import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hand } from '../entities/hand.entity';
import { GameType, TournamentStage } from '../entities/hand.entity';

@Injectable()
export class HandService {
  constructor(
    @InjectRepository(Hand)
    private readonly handRepository: Repository<Hand>,
  ) {}

  async createHand(
    userId: string,
    gameType: GameType,
    blindLevel: string,
    effectiveStack: number,
    boardFlop: string,
    tournamentStage?: TournamentStage,
    boardTurn?: string,
    boardRiver?: string,
  ) {
    const hand = this.handRepository.create({
      userId,
      gameType,
      tournamentStage,
      blindLevel,
      effectiveStack,
      boardFlop,
      boardTurn,
      boardRiver,
    });

    return this.handRepository.save(hand);
  }

  async getHandById(id: string, userId: string) {
    const hand = await this.handRepository.findOne({
      where: { id, userId },
    });

    if (!hand) {
      throw new NotFoundException('手牌不存在');
    }

    return hand;
  }

  async getHandsByUser(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [hands, total] = await this.handRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: hands,
      total,
      page,
      limit,
    };
  }

  async updateHand(id: string, userId: string, updates: Partial<Hand>) {
    const hand = await this.getHandById(id, userId);

    Object.assign(hand, updates);
    return this.handRepository.save(hand);
  }

  async deleteHand(id: string, userId: string) {
    const hand = await this.getHandById(id, userId);
    return this.handRepository.remove(hand);
  }
}
