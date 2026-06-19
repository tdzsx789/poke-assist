import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ActionService } from './actions.service';
import { Street, ActionType, SizeUnit } from '../entities/action.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('行动')
@Controller('api/actions')
@UseGuards(JwtAuthGuard)
export class ActionController {
  constructor(private readonly actionService: ActionService) {}

  @Post()
  @ApiOperation({ summary: '创建行动' })
  async createAction(@Body() body: any) {
    return this.actionService.createAction(
      body.handId,
      body.playerId,
      body.street as Street,
      body.actionType as ActionType,
      body.actionOrder,
      body.actionSize,
      body.sizeUnit as SizeUnit,
    );
  }

  @Get('hand/:handId')
  @ApiOperation({ summary: '获取手牌的所有行动' })
  async getActionsByHand(@Param('handId') handId: string) {
    return this.actionService.getActionsByHand(handId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取行动详情' })
  async getAction(@Param('id') id: string) {
    return this.actionService.getActionById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新行动信息' })
  async updateAction(@Param('id') id: string, @Body() body: any) {
    return this.actionService.updateAction(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除行动' })
  async deleteAction(@Param('id') id: string) {
    return this.actionService.deleteAction(id);
  }
}
