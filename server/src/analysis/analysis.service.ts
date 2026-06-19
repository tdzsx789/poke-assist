import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { ActionAnalysis } from '../entities/action-analysis.entity';
import { AnalysisStatus } from '../entities/action-analysis.entity';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class AnalysisService {
  private openai: OpenAI;

  constructor(
    @InjectRepository(ActionAnalysis)
    private readonly actionAnalysisRepository: Repository<ActionAnalysis>,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'sk-vI85iLKWntfkq8g63a9c8f23A19c421688593f32126c78Ad',
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai-next.com/v1',
    });
  }

  private buildSystemPrompt(): string {
    return `你是一名顶级GTO策略德州扑克分析师，专注于锦标赛（MTT）手牌复盘。
你的目标是最大化长期EV（Expected Value），并在分析中同时考虑：
- GTO策略（平衡范围、频率、混合策略）
- exploit调整（针对对手倾向）
- 锦标赛特有因素（ICM压力、筹码分布、盲注结构）

在每一手牌分析中，你必须：
1. 明确构建双方range（翻前 + 每一街更新）
2. 分街分析（preflop / flop / turn / river）
3. 给出每个决策的EV逻辑（而不是只给结论）
4. 指出最优策略（GTO）与更高EV的 exploit 偏离（如果存在）
5. 评估下注尺度（bet sizing）的合理性
6. 在信息不足时，明确列出假设，而不是随意判断

输出结构必须如下：
- 手牌总结
- 关键决策点
- Range分析
- EV对比（不同选择）
- 最优打法（GTO）
- exploit建议（如果有）
- 一句话结论（最关键调整点）

禁止：
- 只给模糊建议（如"可以考虑"）
- 跳过range分析
- 不解释原因直接给答案

如果手牌涉及ICM，你必须优先考虑ICM影响，而不是仅用cash game逻辑。`;
  }

  async analyzeAction(actionData: any): Promise<ActionAnalysis> {
    const analysis = this.actionAnalysisRepository.create({
      actionId: actionData.id,
      analysisStatus: AnalysisStatus.PROCESSING,
    });

    await this.actionAnalysisRepository.save(analysis);

    try {
      const userPrompt = this.buildUserPrompt(actionData);
      const model = process.env.OPENAI_MODEL || 'claude-haiku-4-5-20251001-thinking';

      const completion = await this.openai.chat.completions.create({
        model: model,
        stream: false,
        messages: [
          { role: 'system', content: this.buildSystemPrompt() },
          { role: 'user', content: userPrompt },
        ],
      });

      const result = completion.choices[0].message.content || '';

      const parsedResult = this.parseAnalysisResult(result);

      analysis.analysisStatus = AnalysisStatus.COMPLETED;
      analysis.evValue = parsedResult.evValue;
      analysis.gtoScore = parsedResult.gtoScore;
      analysis.optimalAction = parsedResult.optimalAction;
      analysis.suggestion = parsedResult.suggestion;
      analysis.rangeAnalysis = parsedResult.rangeAnalysis;

      return this.actionAnalysisRepository.save(analysis);
    } catch (error) {
      analysis.analysisStatus = AnalysisStatus.FAILED;
      analysis.suggestion = `分析失败: ${error.message}`;
      return this.actionAnalysisRepository.save(analysis);
    }
  }

  private buildUserPrompt(actionData: any): string {
    const parts: string[] = [];

    if (actionData.tournamentStage) {
      parts.push(`锦标赛阶段：${actionData.tournamentStage}`);
    }
    if (actionData.blindLevel) {
      parts.push(`盲注：${actionData.blindLevel}`);
    }
    if (actionData.effectiveStack) {
      parts.push(`有效筹码：${actionData.effectiveStack}bb`);
    }
    if (actionData.heroPosition && actionData.villainPosition) {
      parts.push(`位置：Hero ${actionData.heroPosition}，Villain ${actionData.villainPosition}`);
    }
    if (actionData.heroHand) {
      parts.push(`手牌：${actionData.heroHand}`);
    }

    if (actionData.preflopActions) {
      parts.push(`\nPreflop：${actionData.preflopActions}`);
    }
    if (actionData.flopBoard) {
      parts.push(`Flop：${actionData.flopBoard}`);
    }
    if (actionData.flopActions) {
      parts.push(`Flop行动：${actionData.flopActions}`);
    }
    if (actionData.turnBoard) {
      parts.push(`Turn：${actionData.turnBoard}`);
    }
    if (actionData.turnActions) {
      parts.push(`Turn行动：${actionData.turnActions}`);
    }
    if (actionData.riverBoard) {
      parts.push(`River：${actionData.riverBoard}`);
    }
    if (actionData.riverActions) {
      parts.push(`River行动：${actionData.riverActions}`);
    }

    if (actionData.opponentInfo) {
      parts.push(`\n对手信息：${actionData.opponentInfo}`);
    }

    if (actionData.question) {
      parts.push(`\n问题：${actionData.question}`);
    }

    return parts.join('\n');
  }

  private parseAnalysisResult(result: string) {
    const evMatch = result.match(/EV[\s:]*([\d.]+)/);
    const scoreMatch = result.match(/GTO评分[\s:]*([\d.]+)/);
    const optimalMatch = result.match(/最优[行打]法[\s:]*([^\n]+)/);

    return {
      evValue: evMatch ? parseFloat(evMatch[1]) : null,
      gtoScore: scoreMatch ? parseFloat(scoreMatch[1]) : null,
      optimalAction: optimalMatch ? optimalMatch[1].trim() : null,
      suggestion: result.slice(0, 500),
      rangeAnalysis: result,
    };
  }

  async getActionAnalysis(actionId: string) {
    return this.actionAnalysisRepository.findOne({
      where: { actionId },
    });
  }

  async analyzeHand(handData: any) {
    const analyses = [];

    for (const action of handData.actions || []) {
      const actionData = {
        ...handData,
        ...action,
      };
      const analysis = await this.analyzeAction(actionData);
      analyses.push(analysis);
    }

    const avgScore = analyses.reduce((sum, a) => sum + (a.gtoScore || 0), 0) / analyses.length;

    return {
      analyses,
      overallGtoScore: avgScore,
    };
  }
}
