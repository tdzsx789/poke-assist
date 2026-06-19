import { Controller, Post, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StrategyService } from './strategy.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('策略调整')
@Controller('api/strategy')
@UseGuards(JwtAuthGuard)
export class StrategyController {
  constructor(private readonly strategyService: StrategyService) {}

  @Post('adjustments')
  @ApiOperation({ summary: '创建策略调整' })
  async createAdjustment(@Body() body: any) {
    return this.strategyService.createStrategyAdjustment(body);
  }

  @Get('adjustments')
  @ApiOperation({ summary: '获取策略调整列表' })
  async getAdjustments(@Param() params: { playerId?: string; userId?: string }) {
    return this.strategyService.getStrategyAdjustments(params.playerId, params.userId);
  }

  @Put('adjustments/:id')
  @ApiOperation({ summary: '更新策略调整' })
  async updateAdjustment(@Param('id') id: string, @Body() body: any) {
    return this.strategyService.updateStrategyAdjustment(id, body);
  }

  @Post('evaluations')
  @ApiOperation({ summary: '创建策略评估' })
  async createEvaluation(@Body() body: any) {
    return this.strategyService.createStrategyEvaluation(body);
  }

  @Get('evaluations/:adjustmentId')
  @ApiOperation({ summary: '获取策略评估列表' })
  async getEvaluations(@Param('adjustmentId') adjustmentId: string) {
    return this.strategyService.getStrategyEvaluations(adjustmentId);
  }

  @Get('effectiveness/:adjustmentId')
  @ApiOperation({ summary: '评估策略效果' })
  async evaluateEffectiveness(@Param('adjustmentId') adjustmentId: string) {
    return this.strategyService.evaluateStrategyEffectiveness(adjustmentId);
  }
}
