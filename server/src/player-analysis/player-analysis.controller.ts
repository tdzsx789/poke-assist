import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PlayerAnalysisService } from './player-analysis.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('对手分析')
@Controller('api/player-analysis')
@UseGuards(JwtAuthGuard)
export class PlayerAnalysisController {
  constructor(private readonly playerAnalysisService: PlayerAnalysisService) {}

  @Post(':playerId')
  @ApiOperation({ summary: '分析玩家' })
  async analyzePlayer(@Param('playerId') playerId: string, @Body() body: { userId: string }) {
    return this.playerAnalysisService.analyzePlayer(playerId, body.userId);
  }

  @Get(':playerId')
  @ApiOperation({ summary: '获取玩家分析' })
  async getPlayerAnalysis(@Param('playerId') playerId: string) {
    return this.playerAnalysisService.getPlayerAnalysis(playerId);
  }

  @Post(':playerId/update')
  @ApiOperation({ summary: '更新玩家分析' })
  async updatePlayerAnalysis(@Param('playerId') playerId: string, @Body() body: any) {
    return this.playerAnalysisService.updatePlayerAnalysis(playerId, body);
  }

  @Get(':playerId/type')
  @ApiOperation({ summary: '推断玩家类型' })
  async inferPlayerType(@Param('playerId') playerId: string) {
    const type = await this.playerAnalysisService.inferPlayerType(playerId);
    return { playerId, playerType: type };
  }

  @Post(':playerId/patterns')
  @ApiOperation({ summary: '添加玩家模式' })
  async addPlayerPattern(@Param('playerId') playerId: string, @Body() body: any) {
    return this.playerAnalysisService.addPlayerPattern(
      playerId,
      body.userId,
      body.patternType,
      body.position,
      body.boardTexture,
    );
  }

  @Get(':playerId/patterns')
  @ApiOperation({ summary: '获取玩家模式列表' })
  async getPlayerPatterns(@Param('playerId') playerId: string) {
    return this.playerAnalysisService.getPlayerPatterns(playerId);
  }
}
