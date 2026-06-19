import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { AnalyzeHandDto } from './dto/analyze-hand.dto';

@Injectable()
export class OpenaiService {
  private openai: OpenAI;

  constructor() {
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

  private buildUserPrompt(dto: AnalyzeHandDto): string {
    const parts: string[] = [];

    parts.push(`锦标赛阶段：${dto.tournamentStage}`);
    parts.push(`盲注：${dto.blindLevel}`);
    parts.push(`有效筹码：Hero ${dto.heroStack}bb，Villain ${dto.villainStack}bb`);
    parts.push(`位置：Hero ${dto.heroPosition}，Villain ${dto.villainPosition}`);
    parts.push(`手牌：${dto.heroHand}`);

    if (dto.villainHand) {
      parts.push(`对手手牌（已知）：${dto.villainHand}`);
    }

    parts.push(`\nPreflop：${dto.preflopActions}`);
    parts.push(`Flop：${dto.flopBoard}`);
    parts.push(`Flop行动：${dto.flopActions}`);

    if (dto.turnBoard) {
      parts.push(`Turn：${dto.turnBoard}`);
      if (dto.turnActions) {
        parts.push(`Turn行动：${dto.turnActions}`);
      }
    }

    if (dto.riverBoard) {
      parts.push(`River：${dto.riverBoard}`);
      if (dto.riverActions) {
        parts.push(`River行动：${dto.riverActions}`);
      }
    }

    if (dto.opponentInfo) {
      parts.push(`\n对手信息：${dto.opponentInfo}`);
    }

    if (dto.question) {
      parts.push(`\n问题：${dto.question}`);
    }

    return parts.join('\n');
  }

  async analyzeHand(dto: AnalyzeHandDto): Promise<any> {
    const model = process.env.OPENAI_MODEL || 'claude-haiku-4-5-20251001-thinking';

    const completion = await this.openai.chat.completions.create({
      model: model,
      stream: false,
      messages: [
        { role: 'system', content: this.buildSystemPrompt() },
        { role: 'user', content: this.buildUserPrompt(dto) },
      ],
    });

    return {
      success: true,
      data: {
        analysis: completion.choices[0].message.content,
        model: model,
        usage: completion.usage,
      },
    };
  }

  async analyzeWithCustomPrompt(systemPrompt: string, userPrompt: string): Promise<any> {
    const model = process.env.OPENAI_MODEL || 'claude-haiku-4-5-20251001-thinking';

    const completion = await this.openai.chat.completions.create({
      model: model,
      stream: false,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    return {
      success: true,
      data: {
        analysis: completion.choices[0].message.content,
        model: model,
        usage: completion.usage,
      },
    };
  }
}
