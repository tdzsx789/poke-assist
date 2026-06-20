export type SectionKey = 'auth' | 'review' | 'library' | 'opponents' | 'strategies' | 'bankroll' | 'stats'
export type GameType = 'TOURNAMENT' | 'CASH'
export type TournamentStage = 'EARLY' | 'BUBBLE' | 'ITM' | 'FT'
export type Position = 'UTG' | 'UTG1' | 'UTG2' | 'LJ' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB'
export type PlayerType =
  | 'TIGHT_AGGRESSIVE'
  | 'LOOSE_AGGRESSIVE'
  | 'TIGHT_PASSIVE'
  | 'LOOSE_PASSIVE'
  | 'GTO'
  | 'UNKNOWN'
export type Street = 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER'
export type ActionType = 'OPEN' | 'CALL' | 'RAISE' | '3BET' | '4BET' | 'CHECK' | 'BET' | 'FOLD' | 'ALLIN'
export type SizeUnit = 'BB' | 'PERCENT' | 'ABSOLUTE'
export type AnalysisStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
export type PatternType = 'PREFLOP_OPEN' | 'CBET' | 'CHECK_RAISE' | 'RIVER_ALLIN' | '3BET' | '4BET' | 'FLOAT' | 'SLOW_PLAY'
export type AdjustmentType = 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'GENERAL'
export type AdjustmentScope = 'OPEN' | '3BET' | 'CALL' | 'BET' | 'RAISE' | 'CHECK' | 'FOLD'
export type StrategyOutcome = 'WIN' | 'LOSS' | 'DRAW'

export type UserProfile = {
  id: string
  username: string
  email: string
  tokenExpiresAt: string
}

export type AuthState = {
  token: string
  profile: UserProfile
}

export type HandInfo = {
  id: string
  userId: string
  handName: string
  source: string
  gameType: GameType
  tournamentStage: TournamentStage
  smallBlind: number | ''
  bigBlind: number | ''
  ante: number | ''
  effectiveStack: number
  boardFlop: string
  boardTurn: string
  boardRiver: string
  heroCards: string
  result: string
  rawHistory: string
  overallGtoScore?: number
  overallSuggestion?: string
  analysisDirty: boolean
  createdAt: string
  updatedAt: string
}

export type PlayerDraft = {
  name: string
  position: Position
  playerType: PlayerType
  startingStack: number
  isHero: boolean
  holeCards: string
  rangeNotes: string
}

export type HandPlayer = PlayerDraft & {
  id: string
}

export type TableTemplate = {
  id: string
  name: string
  tableSize: number
  players: HandPlayer[]
  createdAt: string
  updatedAt: string
}

export type TableTemplateDraft = {
  id?: string
  name: string
  tableSize: number
  players: HandPlayer[]
}

export type ActionAnalysis = {
  id: string
  actionId: string
  analysisStatus: AnalysisStatus
  evValue: number
  gtoScore: number
  optimalAction: ActionType
  suggestion: string
  rangeAnalysis: string
  betSizingReview: string
  exploitAdjustment: string
  icmImpact: string
  oneLineConclusion: string
}

export type ActionDraft = {
  playerId: string
  street: Street
  actionType: ActionType
  actionSize: number
  sizeUnit: SizeUnit
}

export type HandAction = ActionDraft & {
  id: string
  handId: string
  actionOrder: number
  analysisStatus: AnalysisStatus
  analysis?: ActionAnalysis
}

export type HandSummary = {
  id: string
  title: string
  gameType: GameType
  stage: TournamentStage
  heroCards: string
  board: string
  opponentType: PlayerType
  score: number
  lowestAction: string
  createdAt: string
  analysisDirty: boolean
}

export type HandFilters = {
  search?: string
  gameType?: 'ALL' | GameType
  stage?: 'ALL' | TournamentStage
  opponentType?: 'ALL' | PlayerType
  maxScore?: number
  dateFrom?: string
  dateTo?: string
}

export type PlayerPattern = {
  id: string
  patternType: PatternType
  position: Position | 'ANY'
  boardTexture: string
  frequency: number
  averageSize: number
  successRate: number
  sampleSize: number
}

export type OpponentProfile = {
  id: string
  name: string
  manualType: PlayerType
  inferredType: PlayerType
  analyzedHandsCount: number
  preflopStats: {
    openFreq: number
    threeBetFreq: number
    callFreq: number
    foldFreq: number
  }
  postflopStats: {
    flopCbetFreq: number
    flopRaiseFreq: number
    turnBetFreq: number
    riverBetFreq: number
  }
  styleMetrics: {
    bluffProbability: number
    valueBetProbability: number
    aggressionFactor: number
    tightnessFactor: number
  }
  inferredRanges: {
    preflop: string
    postflop: string
  }
  patterns: PlayerPattern[]
  handIds: string[]
}

export type StrategyAdjustment = {
  id: string
  playerId: string
  playerName: string
  adjustmentType: AdjustmentType
  adjustmentScope: AdjustmentScope
  originalStrategy: string
  adjustedStrategy: string
  reason: string
  expectedEvImprovement: number
  confidenceLevel: number
  isActive: boolean
  lastUsedAt?: string
  createdAt: string
  updatedAt: string
}

export type StrategyDraft = {
  playerId: string
  adjustmentType: AdjustmentType
  adjustmentScope: AdjustmentScope
  originalStrategy: string
  adjustedStrategy: string
  reason: string
  expectedEvImprovement: number
  confidenceLevel: number
}

export type StrategyEvaluation = {
  id: string
  adjustmentId: string
  handId: string
  actualEv: number
  expectedEv: number
  evDifference: number
  outcome: StrategyOutcome
  wasAdjustmentApplied: boolean
  effectivenessRating: number
  notes: string
  createdAt: string
}

export type StrategyEvaluationDraft = Omit<StrategyEvaluation, 'id' | 'createdAt'>

export type StatisticsOverview = {
  averageScore: number
  reviewedHands: number
  lowScoreActions: number
  bestPosition: Position
  trend: Array<{ label: string; score: number }>
  byPosition: Array<{ position: Position; winRate: number }>
  byOpponentType: Array<{ playerType: PlayerType; count: number }>
  byStreet: Array<{ street: Street; mistakes: number }>
}

const wait = (ms = 260) => new Promise((resolve) => window.setTimeout(resolve, ms))
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
const today = '2026-06-15T00:00:00.000Z'
const tableTemplateStorageKey = 'poker-review-table-templates'

const readStoredTableTemplates = (): TableTemplate[] | null => {
  try {
    const raw = window.localStorage.getItem(tableTemplateStorageKey)
    return raw ? (JSON.parse(raw) as TableTemplate[]) : null
  } catch {
    return null
  }
}

const writeStoredTableTemplates = (templates: TableTemplate[]) => {
  try {
    window.localStorage.setItem(tableTemplateStorageKey, JSON.stringify(templates))
  } catch {
    // localStorage may be unavailable in private mode; the in-memory mock still works.
  }
}

let auth: AuthState = {
  token: 'mock-jwt-token-valid-for-7d',
  profile: {
    id: 'user-001',
    username: 'tree',
    email: 'tree@example.com',
    tokenExpiresAt: '2026-06-22T00:00:00.000Z',
  },
}

let hand: HandInfo = {
  id: 'hand-draft-001',
  userId: auth.profile.id,
  handName: '',
  source: '',
  gameType: 'TOURNAMENT',
  tournamentStage: 'FT',
  smallBlind: 100,
  bigBlind: 200,
  ante: '',
  effectiveStack: 35,
  boardFlop: '黑桃J 方块7 梅花2',
  boardTurn: '',
  boardRiver: '',
  heroCards: '红桃A 黑桃J',
  result: 'Hero won / lost / unknown',
  rawHistory: '可粘贴平台导出的完整 hand history，系统后续可自动拆出玩家和行动。',
  analysisDirty: false,
  createdAt: today,
  updatedAt: today,
}

let players: HandPlayer[] = [
  {
    id: 'player-lj',
    name: 'LJ_Player',
    position: 'LJ',
    playerType: 'TIGHT_AGGRESSIVE',
    startingStack: 31,
    isHero: false,
    holeCards: '',
    rangeNotes: '偏标准紧凶，LJ open 范围较稳。',
  },
  {
    id: 'player-hj',
    name: 'HJ_Player',
    position: 'HJ',
    playerType: 'UNKNOWN',
    startingStack: 28,
    isHero: false,
    holeCards: '',
    rangeNotes: '样本不足，先按未知玩家处理。',
  },
  {
    id: 'player-co',
    name: 'CO_Player',
    position: 'CO',
    playerType: 'LOOSE_AGGRESSIVE',
    startingStack: 46,
    isHero: false,
    holeCards: '',
    rangeNotes: 'CO 位置入池偏宽，翻后攻击频率较高。',
  },
  {
    id: 'player-hero',
    name: 'Hero',
    position: 'BTN',
    playerType: 'GTO',
    startingStack: 35,
    isHero: true,
    holeCards: '红桃A 黑桃J',
    rangeNotes: 'BTN 标准 open 范围。',
  },
  {
    id: 'player-sb',
    name: 'SB_Player',
    position: 'SB',
    playerType: 'TIGHT_PASSIVE',
    startingStack: 42,
    isHero: false,
    holeCards: '',
    rangeNotes: '偏紧，经常跟注。',
  },
  {
    id: 'player-bb',
    name: 'BB_Player',
    position: 'BB',
    playerType: 'LOOSE_PASSIVE',
    startingStack: 38,
    isHero: false,
    holeCards: '',
    rangeNotes: '大盲防守偏宽，但主动加注较少。',
  },
]

let tableTemplates: TableTemplate[] = readStoredTableTemplates() ?? [
  {
    id: 'table-default-6max',
    name: '默认 6 人桌 · FT 常用牌桌',
    tableSize: 6,
    players: clone(players),
    createdAt: today,
    updatedAt: today,
  },
]

let actions: HandAction[] = [
  {
    id: 'action-001',
    handId: hand.id,
    playerId: 'player-hero',
    street: 'PREFLOP',
    actionType: 'OPEN',
    actionSize: 2.2,
    sizeUnit: 'BB',
    actionOrder: 1,
    analysisStatus: 'COMPLETED',
    analysis: {
      id: 'analysis-001',
      actionId: 'action-001',
      analysisStatus: 'COMPLETED',
      evValue: 15.2,
      gtoScore: 86,
      optimalAction: 'OPEN',
      suggestion: 'BTN 红桃A黑桃J 是标准开池，尺度合理。',
      rangeAnalysis: 'BTN open 范围可覆盖大部分 A 同花组合、Broadway 和中高对子，红桃A黑桃J 位于价值区间。',
      betSizingReview: '2.2BB 在 FT 有效筹码 35BB 时合理，能降低被 3-bet 的损失。',
      exploitAdjustment: '若盲位过度弃牌，可以扩大 open 范围并保持小尺度。',
      icmImpact: 'FT 阶段避免使用过大 open 尺度，保留后手弹性。',
      oneLineConclusion: '这是一个低风险、符合 GTO 的标准 open。',
    },
  },
  {
    id: 'action-002',
    handId: hand.id,
    playerId: 'player-sb',
    street: 'PREFLOP',
    actionType: 'CALL',
    actionSize: 2,
    sizeUnit: 'BB',
    actionOrder: 2,
    analysisStatus: 'PENDING',
  },
]

players = clone(tableTemplates[0]?.players ?? players)
actions = actions.filter((action) => players.some((player) => player.id === action.playerId))

let handSummaries: HandSummary[] = [
  {
    id: hand.id,
    title: 'FT 红桃A黑桃J BTN open vs SB call',
    gameType: hand.gameType,
    stage: hand.tournamentStage,
    heroCards: hand.heroCards,
    board: `${hand.boardFlop} · ${hand.boardTurn} · ${hand.boardRiver}`,
    opponentType: 'TIGHT_PASSIVE',
    score: 78,
    lowestAction: 'Turn raise',
    createdAt: hand.createdAt,
    analysisDirty: false,
  },
  {
    id: 'hand-archive-002',
    title: 'Cash 红桃K红桃Q 3-bet pot OOP',
    gameType: 'CASH',
    stage: 'EARLY',
    heroCards: '红桃K 红桃Q',
    board: '方块Q 红桃8 黑桃4 · 梅花2 · 梅花J',
    opponentType: 'LOOSE_AGGRESSIVE',
    score: 62,
    lowestAction: 'River call',
    createdAt: '2026-06-12T08:20:00.000Z',
    analysisDirty: false,
  },
  {
    id: 'hand-archive-003',
    title: 'Bubble 梅花A方块K vs 4-bet shove',
    gameType: 'TOURNAMENT',
    stage: 'BUBBLE',
    heroCards: '梅花A 方块K',
    board: '-',
    opponentType: 'TIGHT_AGGRESSIVE',
    score: 91,
    lowestAction: 'Preflop call',
    createdAt: '2026-06-10T14:45:00.000Z',
    analysisDirty: false,
  },
]

let opponents: OpponentProfile[] = [
  {
    id: 'player-sb',
    name: 'SB_Player',
    manualType: 'TIGHT_PASSIVE',
    inferredType: 'TIGHT_PASSIVE',
    analyzedHandsCount: 23,
    preflopStats: { openFreq: 15.2, threeBetFreq: 5.8, callFreq: 25, foldFreq: 54 },
    postflopStats: { flopCbetFreq: 42.4, flopRaiseFreq: 8.2, turnBetFreq: 31.6, riverBetFreq: 18.5 },
    styleMetrics: { bluffProbability: 17.5, valueBetProbability: 82.5, aggressionFactor: 0.82, tightnessFactor: 0.76 },
    inferredRanges: {
      preflop: '翻前偏紧，盲位冷跟范围多为中等对子、Axs 和部分 Broadway。',
      postflop: '翻后倾向跟注强摊牌价值，低频 bluff，面对大额 turn raise 弃牌偏高。',
    },
    patterns: [
      {
        id: 'pattern-001',
        patternType: 'PREFLOP_OPEN',
        position: 'SB',
        boardTexture: 'ANY',
        frequency: 15.2,
        averageSize: 2.4,
        successRate: 48,
        sampleSize: 23,
      },
      {
        id: 'pattern-002',
        patternType: 'CBET',
        position: 'ANY',
        boardTexture: 'dry',
        frequency: 42.4,
        averageSize: 36,
        successRate: 51,
        sampleSize: 18,
      },
    ],
    handIds: ['hand-draft-001', 'hand-archive-003'],
  },
  {
    id: 'opponent-002',
    name: 'Reg_LAG_88',
    manualType: 'LOOSE_AGGRESSIVE',
    inferredType: 'LOOSE_AGGRESSIVE',
    analyzedHandsCount: 41,
    preflopStats: { openFreq: 31.8, threeBetFreq: 12.4, callFreq: 28.3, foldFreq: 27.5 },
    postflopStats: { flopCbetFreq: 68.2, flopRaiseFreq: 16.4, turnBetFreq: 53.3, riverBetFreq: 39.1 },
    styleMetrics: { bluffProbability: 31.2, valueBetProbability: 68.8, aggressionFactor: 2.34, tightnessFactor: 0.42 },
    inferredRanges: {
      preflop: 'CO/BTN 位置 open 范围偏宽，3-bet 包含较多 Axs 和 blocker bluff。',
      postflop: '翻后持续下注频率高，河牌 bluff 倾向明显。',
    },
    patterns: [
      {
        id: 'pattern-003',
        patternType: '3BET',
        position: 'BTN',
        boardTexture: 'ANY',
        frequency: 12.4,
        averageSize: 8.5,
        successRate: 57,
        sampleSize: 41,
      },
      {
        id: 'pattern-004',
        patternType: 'RIVER_ALLIN',
        position: 'ANY',
        boardTexture: 'wet',
        frequency: 7.2,
        averageSize: 91,
        successRate: 44,
        sampleSize: 9,
      },
    ],
    handIds: ['hand-archive-002'],
  },
]

let strategies: StrategyAdjustment[] = [
  {
    id: 'strategy-001',
    playerId: 'player-sb',
    playerName: 'SB_Player',
    adjustmentType: 'TURN',
    adjustmentScope: 'RAISE',
    originalStrategy: '按 GTO 保持强牌和高权益听牌的平衡加注范围。',
    adjustedStrategy: '对紧弱对手提高 turn 半诈唬加注频率，但价值牌可使用更小尺度诱导。',
    reason: '对手 turn 面对大额加注弃牌率高，且 river bluff 频率低。',
    expectedEvImprovement: 2.5,
    confidenceLevel: 85,
    isActive: true,
    lastUsedAt: today,
    createdAt: today,
    updatedAt: today,
  },
]

let evaluations: StrategyEvaluation[] = [
  {
    id: 'evaluation-001',
    adjustmentId: 'strategy-001',
    handId: hand.id,
    actualEv: 18.5,
    expectedEv: 16,
    evDifference: 2.5,
    outcome: 'WIN',
    wasAdjustmentApplied: true,
    effectivenessRating: 5,
    notes: '成功应用策略调整，turn raise 后对手弃牌。',
    createdAt: today,
  },
]

const syncCurrentHandSummary = () => {
  handSummaries = handSummaries.map((summary) =>
    summary.id === hand.id
      ? {
          ...summary,
          title: hand.handName || summary.title,
          gameType: hand.gameType,
          stage: hand.tournamentStage,
          heroCards: hand.heroCards,
          board: `${hand.boardFlop || '-'} · ${hand.boardTurn || '-'} · ${hand.boardRiver || '-'}`,
          score: hand.overallGtoScore ?? summary.score,
          analysisDirty: hand.analysisDirty,
        }
      : summary,
  )
}

const markAnalysisDirty = () => {
  hand = { ...hand, analysisDirty: true, updatedAt: new Date().toISOString() }
  syncCurrentHandSummary()
}

const buildAnalysis = (action: HandAction): ActionAnalysis => {
  const score = action.actionType === 'CALL' ? 70 : action.actionType === 'RAISE' ? 64 : 82
  return {
    id: id('analysis'),
    actionId: action.id,
    analysisStatus: 'COMPLETED',
    evValue: Number((score / 6.2).toFixed(1)),
    gtoScore: score,
    optimalAction: action.actionType === 'CALL' ? 'FOLD' : action.actionType,
    suggestion:
      action.actionType === 'CALL'
        ? '当前位置跟注范围需要收紧，建议结合对手 open 频率选择 fold 或 3-bet。'
        : '当前行动整体可接受，但需要复核下注尺度和对手类型。',
    rangeAnalysis: '系统基于当前街道、位置、筹码深度和已录入对手类型生成范围推断。',
    betSizingReview: '下注尺度会与底池比例、有效筹码和 ICM 压力一起评估。',
    exploitAdjustment: '若对手偏紧弱，可提高攻击频率；若对手偏松凶，应扩大价值范围。',
    icmImpact: hand.gameType === 'TOURNAMENT' ? '锦标赛场景下需降低边缘高波动线。' : '现金局主要关注长期 EV。',
    oneLineConclusion: '这是 mock AI 返回的行动级结论，后续可替换为真实 OpenAI 响应。',
  }
}

const statisticsBase: StatisticsOverview = {
  averageScore: 78,
  reviewedHands: 36,
  lowScoreActions: 9,
  bestPosition: 'BTN',
  trend: [
    { label: '6/10', score: 67 },
    { label: '6/11', score: 71 },
    { label: '6/12', score: 69 },
    { label: '6/13', score: 76 },
    { label: '6/14', score: 78 },
    { label: '6/15', score: 82 },
  ],
  byPosition: [
    { position: 'BTN', winRate: 58 },
    { position: 'CO', winRate: 52 },
    { position: 'BB', winRate: 43 },
    { position: 'SB', winRate: 39 },
  ],
  byOpponentType: [
    { playerType: 'TIGHT_PASSIVE', count: 12 },
    { playerType: 'LOOSE_AGGRESSIVE', count: 9 },
    { playerType: 'TIGHT_AGGRESSIVE', count: 7 },
    { playerType: 'UNKNOWN', count: 8 },
  ],
  byStreet: [
    { street: 'PREFLOP', mistakes: 2 },
    { street: 'FLOP', mistakes: 3 },
    { street: 'TURN', mistakes: 7 },
    { street: 'RIVER', mistakes: 4 },
  ],
}

export const mockApi = {
  async register(payload: { username: string; email: string; password: string }) {
    await wait()
    auth = {
      token: 'mock-jwt-token-valid-for-7d',
      profile: {
        id: 'user-001',
        username: payload.username || 'tree',
        email: payload.email || 'tree@example.com',
        tokenExpiresAt: '2026-06-22T00:00:00.000Z',
      },
    }
    return clone(auth)
  },

  async login(payload: { username: string; password: string }) {
    await wait()
    auth = {
      token: 'mock-jwt-token-valid-for-7d',
      profile: {
        ...auth.profile,
        username: payload.username || auth.profile.username,
        tokenExpiresAt: '2026-06-22T00:00:00.000Z',
      },
    }
    return clone(auth)
  },

  async logout() {
    await wait()
    return clone({ success: true })
  },

  async getProfile() {
    await wait()
    return clone(auth.profile)
  },

  async changePassword() {
    await wait()
    return clone({ success: true })
  },

  async getReviewDraft() {
    await wait()
    return clone({ hand, players, actions })
  },

  async listTableTemplates() {
    await wait()
    return clone(tableTemplates)
  },

  async saveTableTemplate(payload: TableTemplateDraft) {
    await wait()
    const now = new Date().toISOString()
    const existing = tableTemplates.find((template) => template.id === payload.id || template.name === payload.name)
    const template: TableTemplate = {
      id: existing?.id ?? payload.id ?? id('table'),
      name: payload.name.trim() || `牌桌模板 ${tableTemplates.length + 1}`,
      tableSize: payload.tableSize,
      players: clone(payload.players),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    tableTemplates = existing
      ? tableTemplates.map((item) => (item.id === existing.id ? template : item))
      : [template, ...tableTemplates]
    writeStoredTableTemplates(tableTemplates)
    return clone(template)
  },

  async applyTableTemplate(templateId: string) {
    await wait()
    const template = tableTemplates.find((item) => item.id === templateId) ?? tableTemplates[0]
    if (!template) return clone({ players, actions, hand, template: null })
    players = clone(template.players)
    actions = actions.filter((action) => players.some((player) => player.id === action.playerId))
    markAnalysisDirty()
    return clone({ players, actions, hand, template })
  },

  async startTableDraft(payload: TableTemplateDraft) {
    await wait()
    players = clone(payload.players)
    actions = []
    markAnalysisDirty()
    return clone({ players, actions, hand })
  },

  async createHand(payload: HandInfo) {
    await wait()
    hand = { ...payload, id: payload.id || id('hand'), userId: auth.profile.id, updatedAt: new Date().toISOString() }
    if (!handSummaries.some((summary) => summary.id === hand.id)) {
      handSummaries = [
        {
          id: hand.id,
          title: hand.handName || '未命名手牌',
          gameType: hand.gameType,
          stage: hand.tournamentStage,
          heroCards: hand.heroCards,
          board: `${hand.boardFlop || '-'} · ${hand.boardTurn || '-'} · ${hand.boardRiver || '-'}`,
          opponentType: 'UNKNOWN',
          score: hand.overallGtoScore ?? 0,
          lowestAction: '未分析',
          createdAt: hand.createdAt,
          analysisDirty: hand.analysisDirty,
        },
        ...handSummaries,
      ]
    }
    syncCurrentHandSummary()
    return clone(hand)
  },

  async updateHand(payload: HandInfo) {
    await wait()
    hand = { ...payload, analysisDirty: true, updatedAt: new Date().toISOString() }
    const availableStreets: Street[] = ['PREFLOP']
    const flopReady = hand.boardFlop.split(/\s+/).filter(Boolean).length === 3
    const turnReady = hand.boardTurn.split(/\s+/).filter(Boolean).length === 1
    const riverReady = hand.boardRiver.split(/\s+/).filter(Boolean).length === 1
    if (flopReady) availableStreets.push('FLOP')
    if (flopReady && turnReady) availableStreets.push('TURN')
    if (flopReady && turnReady && riverReady) availableStreets.push('RIVER')
    actions = actions.filter((action) => availableStreets.includes(action.street))
    syncCurrentHandSummary()
    return clone(hand)
  },

  async listHands(filters?: HandFilters) {
    await wait()
    const search = filters?.search?.trim().toLowerCase()
    let result = handSummaries
    if (search) {
      result = result.filter((item) => `${item.title} ${item.heroCards} ${item.board}`.toLowerCase().includes(search))
    }
    if (filters?.gameType && filters.gameType !== 'ALL') {
      result = result.filter((item) => item.gameType === filters.gameType)
    }
    if (filters?.stage && filters.stage !== 'ALL') {
      result = result.filter((item) => item.stage === filters.stage)
    }
    if (filters?.opponentType && filters.opponentType !== 'ALL') {
      result = result.filter((item) => item.opponentType === filters.opponentType)
    }
    if (typeof filters?.maxScore === 'number') {
      result = result.filter((item) => item.score <= filters.maxScore!)
    }
    if (filters?.dateFrom) {
      result = result.filter((item) => item.createdAt.slice(0, 10) >= filters.dateFrom!)
    }
    if (filters?.dateTo) {
      result = result.filter((item) => item.createdAt.slice(0, 10) <= filters.dateTo!)
    }
    return clone(result)
  },

  async getHandDetail(handId: string) {
    await wait()
    const summary = handSummaries.find((item) => item.id === handId)
    return clone({
      summary,
      hand: handId === hand.id ? hand : { ...hand, id: handId, handName: summary?.title ?? hand.handName },
      players,
      actions,
    })
  },

  async deleteHand(handId: string) {
    await wait()
    handSummaries = handSummaries.filter((item) => item.id !== handId)
    return clone(handSummaries)
  },

  async addPlayer(payload: PlayerDraft) {
    await wait()
    const player: HandPlayer = { ...payload, id: id('player') }
    players = payload.isHero
      ? players.map((item) => ({ ...item, isHero: false })).concat(player)
      : players.concat(player)
    markAnalysisDirty()
    return clone({ player, players, hand })
  },

  async updatePlayer(playerId: string, payload: PlayerDraft) {
    await wait()
    players = players.map((player) => (player.id === playerId ? { ...player, ...payload } : player))
    if (payload.isHero) {
      players = players.map((player) => ({ ...player, isHero: player.id === playerId }))
    }
    markAnalysisDirty()
    return clone({ players, hand })
  },

  async deletePlayer(playerId: string) {
    await wait()
    players = players.filter((player) => player.id !== playerId)
    actions = actions.filter((action) => action.playerId !== playerId)
    markAnalysisDirty()
    return clone({ players, actions, hand })
  },

  async addAction(payload: ActionDraft) {
    await wait()
    const action: HandAction = {
      ...payload,
      id: id('action'),
      handId: hand.id,
      actionOrder: actions.length + 1,
      analysisStatus: 'PENDING',
    }
    actions = actions.concat(action)
    markAnalysisDirty()
    return clone({ action, actions, hand })
  },

  async updateAction(actionId: string, payload: ActionDraft) {
    await wait()
    actions = actions.map((action) =>
      action.id === actionId
        ? {
            ...action,
            ...payload,
            analysisStatus: 'PENDING',
            analysis: undefined,
          }
        : action,
    )
    markAnalysisDirty()
    return clone({ actions, hand })
  },

  async deleteAction(actionId: string) {
    await wait()
    actions = actions
      .filter((action) => action.id !== actionId)
      .map((action, index) => ({ ...action, actionOrder: index + 1 }))
    markAnalysisDirty()
    return clone({ actions, hand })
  },

  async analyzeAction(actionId: string) {
    await wait(560)
    actions = actions.map((action) =>
      action.id === actionId
        ? {
            ...action,
            analysisStatus: 'COMPLETED',
            analysis: buildAnalysis(action),
          }
        : action,
    )
    hand = { ...hand, analysisDirty: false, updatedAt: new Date().toISOString() }
    syncCurrentHandSummary()
    return clone(actions.find((action) => action.id === actionId))
  },

  async getActionAnalysis(actionId: string) {
    await wait()
    return clone(actions.find((action) => action.id === actionId)?.analysis)
  },

  async analyzeHand() {
    await wait(720)
    actions = actions.map((action) => {
      const analysis = action.analysis ?? buildAnalysis(action)
      return { ...action, analysisStatus: 'COMPLETED', analysis }
    })
    const scores = actions.map((action) => action.analysis?.gtoScore ?? 72)
    const average = Math.round(scores.reduce((sum, score) => sum + score, 0) / Math.max(scores.length, 1))
    hand = {
      ...hand,
      overallGtoScore: average,
      overallSuggestion: '整手牌最大提升点集中在低分行动。建议优先复盘 turn/river 的尺度和对手画像匹配度。',
      analysisDirty: false,
      updatedAt: new Date().toISOString(),
    }
    syncCurrentHandSummary()
    return clone({ hand, actions })
  },

  async listOpponents() {
    await wait()
    return clone(opponents)
  },

  async getOpponent(playerId: string) {
    await wait()
    return clone(opponents.find((opponent) => opponent.id === playerId))
  },

  async analyzeOpponent(playerId: string) {
    await wait(520)
    opponents = opponents.map((opponent) =>
      opponent.id === playerId
        ? {
            ...opponent,
            analyzedHandsCount: opponent.analyzedHandsCount + 1,
            styleMetrics: {
              ...opponent.styleMetrics,
              bluffProbability: Number(Math.max(10, opponent.styleMetrics.bluffProbability - 1.2).toFixed(1)),
            },
            inferredRanges: {
              ...opponent.inferredRanges,
              postflop: '刚刚基于最新手牌刷新：对手在转牌面对大尺度加注仍倾向弃牌。',
            },
          }
        : opponent,
    )
    return clone(opponents)
  },

  async getOpponentPatterns(playerId: string) {
    await wait()
    return clone(opponents.find((opponent) => opponent.id === playerId)?.patterns ?? [])
  },

  async getOpponentHands(playerId: string) {
    await wait()
    const opponent = opponents.find((item) => item.id === playerId)
    return clone(handSummaries.filter((summary) => opponent?.handIds.includes(summary.id)))
  },

  async listStrategies() {
    await wait()
    return clone(strategies)
  },

  async createStrategy(payload: StrategyDraft) {
    await wait()
    const opponent = opponents.find((item) => item.id === payload.playerId) ?? opponents[0]
    const strategy: StrategyAdjustment = {
      ...payload,
      id: id('strategy'),
      playerId: opponent.id,
      playerName: opponent.name,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    strategies = strategies.concat(strategy)
    return clone(strategies)
  },

  async updateStrategy(strategyId: string, payload: StrategyDraft) {
    await wait()
    const opponent = opponents.find((item) => item.id === payload.playerId)
    strategies = strategies.map((strategy) =>
      strategy.id === strategyId
        ? {
            ...strategy,
            ...payload,
            playerName: opponent?.name ?? strategy.playerName,
            updatedAt: new Date().toISOString(),
          }
        : strategy,
    )
    return clone(strategies)
  },

  async deleteStrategy(strategyId: string) {
    await wait()
    strategies = strategies.filter((strategy) => strategy.id !== strategyId)
    evaluations = evaluations.filter((evaluation) => evaluation.adjustmentId !== strategyId)
    return clone(strategies)
  },

  async toggleStrategy(strategyId: string) {
    await wait()
    strategies = strategies.map((strategy) =>
      strategy.id === strategyId ? { ...strategy, isActive: !strategy.isActive, updatedAt: new Date().toISOString() } : strategy,
    )
    return clone(strategies)
  },

  async createStrategyEvaluation(payload: StrategyEvaluationDraft) {
    await wait()
    const evaluation: StrategyEvaluation = { ...payload, id: id('evaluation'), createdAt: new Date().toISOString() }
    evaluations = evaluations.concat(evaluation)
    strategies = strategies.map((strategy) =>
      strategy.id === payload.adjustmentId ? { ...strategy, lastUsedAt: evaluation.createdAt, updatedAt: evaluation.createdAt } : strategy,
    )
    return clone({ evaluations, strategies })
  },

  async listStrategyEvaluations(strategyId?: string) {
    await wait()
    return clone(strategyId ? evaluations.filter((evaluation) => evaluation.adjustmentId === strategyId) : evaluations)
  },

  async getStatistics(range: '7D' | '30D' | '90D') {
    await wait()
    const modifier = range === '7D' ? 0 : range === '30D' ? -3 : -6
    return clone({
      ...statisticsBase,
      averageScore: statisticsBase.averageScore + modifier,
      reviewedHands: statisticsBase.reviewedHands + (range === '7D' ? 0 : range === '30D' ? 28 : 83),
    })
  },
}
