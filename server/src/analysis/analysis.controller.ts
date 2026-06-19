import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnalysisService } from './analysis.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('分析')
@Controller('api/analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('action/:actionId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '分析单个行动' })
  async analyzeAction(@Param('actionId') actionId: string, @Body() body: any) {
    return this.analysisService.analyzeAction({ id: actionId, ...body });
  }

  @Get('action/:actionId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取行动分析结果' })
  async getActionAnalysis(@Param('actionId') actionId: string) {
    return this.analysisService.getActionAnalysis(actionId);
  }

  @Post('hand')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '分析整手牌' })
  async analyzeHand(@Body() body: any) {
    return this.analysisService.analyzeHand(body);
  }

  @Get('health')
  @ApiOperation({ summary: '健康检查' })
  healthCheck() {
    return {
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
