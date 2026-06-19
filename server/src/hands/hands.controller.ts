import { Controller, Post, Get, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HandService } from './hands.service';
import { GameType, TournamentStage } from '../entities/hand.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('手牌')
@Controller('api/hands')
@UseGuards(JwtAuthGuard)
export class HandController {
  constructor(private readonly handService: HandService) {}

  @Post()
  @ApiOperation({ summary: '创建新手牌' })
  async createHand(@Req() request: any, @Body() body: any) {
    const userId = request.user.userId;
    return this.handService.createHand(
      userId,
      body.gameType as GameType,
      body.blindLevel,
      body.effectiveStack,
      body.boardFlop,
      body.tournamentStage as TournamentStage,
      body.boardTurn,
      body.boardRiver,
    );
  }

  @Get()
  @ApiOperation({ summary: '获取手牌列表' })
  async getHands(
    @Req() request: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.handService.getHandsByUser(request.user.userId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取手牌详情' })
  async getHand(@Req() request: any, @Param('id') id: string) {
    return this.handService.getHandById(id, request.user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新手牌信息' })
  async updateHand(@Req() request: any, @Param('id') id: string, @Body() body: any) {
    return this.handService.updateHand(id, request.user.userId, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除手牌' })
  async deleteHand(@Req() request: any, @Param('id') id: string) {
    return this.handService.deleteHand(id, request.user.userId);
  }
}
