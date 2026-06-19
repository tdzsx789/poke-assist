import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Action } from '../entities/action.entity';
import { ActionController } from './actions.controller';
import { ActionService } from './actions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Action])],
  controllers: [ActionController],
  providers: [ActionService],
})
export class ActionsModule {}
