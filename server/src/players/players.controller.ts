import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PlayerService } from './players.service';
import { PlayerType } from '../entities/user.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('玩家')
@Controller('api/players')
@UseGuards(JwtAuthGuard)
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Post()
  @ApiOperation({ summary: '创建玩家' })
  async createPlayer(@Body() body: any) {
    return this.playerService.createPlayer(
      body.name,
      body.playerType as PlayerType,
      body.rangeNotes,
    );
  }

  @Get()
  @ApiOperation({ summary: '获取所有玩家' })
  async getAllPlayers() {
    return this.playerService.getAllPlayers();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取玩家详情' })
  async getPlayer(@Param('id') id: string) {
    return this.playerService.getPlayerById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新玩家信息' })
  async updatePlayer(@Param('id') id: string, @Body() body: any) {
    return this.playerService.updatePlayer(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除玩家' })
  async deletePlayer(@Param('id') id: string) {
    return this.playerService.deletePlayer(id);
  }
}
