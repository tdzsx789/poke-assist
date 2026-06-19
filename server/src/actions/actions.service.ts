import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Action } from '../entities/action.entity';
import { Street, ActionType, SizeUnit } from '../entities/action.entity';

@Injectable()
export class ActionService {
  constructor(
    @InjectRepository(Action)
    private readonly actionRepository: Repository<Action>,
  ) {}

  async createAction(
    handId: string,
    playerId: string,
    street: Street,
    actionType: ActionType,
    actionOrder: number,
    actionSize?: number,
    sizeUnit: SizeUnit = SizeUnit.BB,
  ) {
    const action = this.actionRepository.create({
      handId,
      playerId,
      street,
      actionType,
      actionSize,
      sizeUnit,
      actionOrder,
    });

    return this.actionRepository.save(action);
  }

  async getActionById(id: string) {
    const action = await this.actionRepository.findOne({
      where: { id },
    });

    if (!action) {
      throw new NotFoundException('行动不存在');
    }

    return action;
  }

  async getActionsByHand(handId: string) {
    return this.actionRepository.find({
      where: { handId },
      order: { actionOrder: 'ASC' },
    });
  }

  async updateAction(id: string, updates: Partial<Action>) {
    const action = await this.getActionById(id);
    Object.assign(action, updates);
    return this.actionRepository.save(action);
  }

  async deleteAction(id: string) {
    const action = await this.getActionById(id);
    return this.actionRepository.remove(action);
  }
}
