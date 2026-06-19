# PokeReview 产品框架重规划

## 1. 产品定位

PokeReview 不应只是一个牌谱文本解析器，而是一个面向德州扑克学习者的复盘工作台。核心目标是把一手牌拆成可分析、可追踪、可复用的行动决策，并让用户逐步形成自己的对手数据库和策略调整库。

一句话定位：

> 面向德州扑克玩家的行动级 AI 复盘系统，帮助用户发现每个决策点的 GTO 偏差、EV 损失和可执行改进策略。

## 2. 产品主线

产品应围绕一条学习闭环设计：

1. 录入手牌：输入牌局基础信息、玩家、位置、筹码、公共牌和行动序列。
2. 结构化复盘：系统把手牌拆成街道、玩家、行动、下注尺度和决策点。
3. 行动级分析：用户可以分析整手牌，也可以点选某个行动单独分析。
4. AI 输出建议：每个行动给出 Range、EV、GTO 评分、最优打法、Exploit 调整和一句话结论。
5. 历史沉淀：保存手牌、筛选低分决策、追踪不同位置和场景下的错误。
6. 对手画像：基于历史手牌推断对手风格、模式和范围。
7. 策略调整：把对手画像转化为可执行调整，再记录实际结果评估收益。

## 3. 信息架构

建议前端主导航采用 5 个一级区域：

| 区域 | 目标 | 核心内容 |
| --- | --- | --- |
| 复盘工作台 | 完成新手牌录入和行动级分析 | 手牌表单、玩家列表、行动时间线、AI 分析面板 |
| 手牌库 | 管理历史手牌和筛选低分场景 | 列表、筛选、搜索、详情、编辑、删除 |
| 对手画像 | 追踪常见对手风格和行动模式 | 对手列表、统计、范围推断、模式识别 |
| 策略库 | 管理针对对手的 Exploit 调整 | 调整建议、启用状态、预期 EV、置信度 |
| 学习统计 | 观察自己的长期进步 | GTO 分数趋势、位置统计、街道错误分布 |

MVP 可以先实现前三个视图的静态/半动态原型：复盘工作台、手牌库、对手画像。策略库和学习统计可以先作为设计占位。

## 4. 复盘工作台交互

复盘工作台应先按 PRD 2.2.1 的顺序进入「手牌信息录入」，再逐步进入玩家、行动和分析。第一屏不直接展示行动时间线和 AI 结果，因为这会跳过 AI 分析所需的基础上下文。

第一步：手牌信息录入

- 游戏类型：锦标赛 / 现金局。
- 锦标赛阶段：Early / Bubble / ITM / FT。
- 盲注级别、Ante、有效筹码。
- 公共牌：Flop / Turn / River。
- Hero 手牌。
- 原始牌谱文本或牌局来源。

第二步：玩家信息

- 支持 Hero + 多个对手。
- 每个玩家录入名称、位置、玩家类型、起始筹码。
- Hero 必填底牌，对手底牌可选。
- 对手可补充 range 描述或历史备注。

第三步：行动信息

- 以 Preflop / Flop / Turn / River 分组。
- 每个行动显示：顺序、玩家、位置、动作、尺度、单位、当前分析状态。
- 支持增删改行动，并在编辑后标记后续分析结果可能过期。

第四步：行动分析结果

- 用户可以分析整手牌，也可以点选某个行动单独分析。
- 结果按行动展示：谁、在哪条街、做了什么。
- GTO 评分和 EV 对比。
- 最优行动建议。
- Range 分析。
- Exploit 调整。
- 下注尺度评估。
- ICM 提醒。
- 一句话结论。

关键交互原则：

- 第一步必须先收集手牌上下文，否则 Range、EV、ICM 和下注尺度分析都会失真。
- 行动是第一等对象，用户不是只看整手牌结论。
- 任何编辑基础信息、玩家、行动后，都要提示「分析结果可能过期」。
- 分析状态必须可见：待分析、分析中、已完成、失败。
- AI 输出要分块，不要只给一段大文本。

## 5. 核心数据模型

前端应围绕后端规范化模型组织状态：

```ts
type Hand = {
  id: string
  gameType: 'TOURNAMENT' | 'CASH'
  tournamentStage?: 'EARLY' | 'BUBBLE' | 'ITM' | 'FT'
  blindLevel: string
  effectiveStack: number
  board: {
    flop?: string
    turn?: string
    river?: string
  }
  overallGtoScore?: number
  overallSuggestion?: string
}

type HandPlayer = {
  id: string
  name: string
  position: 'UTG' | 'MP' | 'CO' | 'BTN' | 'SB' | 'BB'
  playerType: 'TIGHT_AGGRESSIVE' | 'LOOSE_AGGRESSIVE' | 'TIGHT_PASSIVE' | 'LOOSE_PASSIVE' | 'GTO' | 'UNKNOWN'
  startingStack: number
  holeCards?: string
  isHero: boolean
  rangeNotes?: string
}

type Action = {
  id: string
  playerId: string
  street: 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER'
  actionType: 'OPEN' | 'CALL' | 'RAISE' | '3BET' | '4BET' | 'CHECK' | 'BET' | 'FOLD' | 'ALLIN'
  actionSize?: number
  sizeUnit: 'BB' | 'PERCENT' | 'ABSOLUTE'
  actionOrder: number
  analysis?: ActionAnalysis
}
```

## 6. AI 分析逻辑

建议把 AI 分析拆成两个层级：

行动级分析：

- 输入：完整手牌上下文 + 当前行动前的行动序列 + 当前玩家信息 + 对手画像。
- 输出：GTO 评分、EV 对比、最优行动、Range 分析、下注尺度、Exploit 调整、ICM 影响、一句话结论。
- 存储到 `action_analyses`。

整手牌分析：

- 批量触发每个行动的行动级分析。
- 对低分行动做加权总结。
- 生成整手牌 `overall_gto_score` 和 `overall_suggestion`。

Prompt 应强制结构化 JSON 输出，避免后端解析大段自然语言。建议字段：

```json
{
  "gtoScore": 78,
  "ev": {
    "chosen": 12.4,
    "best": 15.8,
    "delta": -3.4
  },
  "optimalAction": "RAISE",
  "rangeAnalysis": "...",
  "betSizingReview": "...",
  "exploitAdjustment": "...",
  "icmImpact": "...",
  "oneLineConclusion": "..."
}
```

## 7. 历史记录交互

手牌库不是简单列表，应服务于复盘学习：

- 默认按最近分析排序。
- 筛选项：时间范围、游戏类型、锦标赛阶段、对手类型、GTO 评分低于某值。
- 搜索：玩家名、手牌、公共牌、备注。
- 列表卡片显示：分数、Hero 手牌、位置、结果、最低分行动、主要错误标签。
- 点击进入详情后，沿用复盘工作台布局，只是进入只读或编辑模式。

## 8. 对手画像与策略闭环

对手画像应从「标签」升级为「可行动的策略依据」：

1. 聚合对手历史行动，生成频率指标。
2. 自动推断风格：紧凶、松凶、紧弱、松弱、GTO、未知。
3. 识别模式：3bet、c-bet、check-raise、river all-in、slow play 等。
4. 生成策略调整：在哪条街、对什么行动、如何偏离 GTO。
5. 用户在后续手牌中标记是否应用策略。
6. 记录实际 EV 和结果，评估策略是否有效。

这让产品从「一次性 AI 评论」变成「持续训练系统」。

## 9. 前端工程建议

建议把当前 React 工程拆成：

```text
src/
  app/
    App.tsx
    routes.ts
  components/
    AppShell.tsx
    MetricCard.tsx
    ActionTimeline.tsx
    AnalysisPanel.tsx
    HandContextPanel.tsx
  features/
    review/
      reviewTypes.ts
      reviewMockData.ts
      ReviewWorkspace.tsx
    hands/
      HandLibrary.tsx
    opponents/
      OpponentProfiles.tsx
    strategies/
      StrategyLibrary.tsx
    statistics/
      LearningStats.tsx
  services/
    apiClient.ts
    analysisService.ts
  styles/
    tokens.css
```

MVP 阶段可以先不接真实后端，用 mock data 把信息架构和交互跑通。后续接 NestJS 时，只需要替换 `services` 层。

## 10. MVP 开发优先级

第一阶段：可用复盘工作台

- 手牌基础信息录入。
- 多玩家录入。
- 行动时间线录入。
- 选中行动显示分析面板。
- 使用 mock AI 分析展示结构。

第二阶段：历史手牌库

- 本地保存或后端保存手牌。
- 列表、筛选、详情。
- 编辑后标记需要重新分析。

第三阶段：真实 AI 分析

- 后端 OpenAI 接口。
- 单行动分析。
- 整手牌分析。
- 分析状态和失败重试。

第四阶段：对手画像和策略库

- 对手聚合统计。
- 模式识别。
- 策略调整创建。
- 策略效果评估。

## 11. 当前前端原型目标

本次 React 原型应先呈现以下产品骨架：

- 顶部/侧边导航展示 5 个一级模块。
- 首页为复盘工作台，而不是营销页。
- 工作台包括牌局上下文、行动时间线、AI 分析面板。
- 附带手牌库、对手画像、策略闭环的概览区域。
- 明确表达「行动级分析」是产品核心。
