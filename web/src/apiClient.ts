import { mockApi } from './mockApi'
import type {
  ActionAnalysis,
  ActionCoachRequest,
  ActionCoachResult,
  ActionDraft,
  ActionType,
  AuthState,
  GameType,
  HandAction,
  HandFilters,
  HandInfo,
  HandPlayer,
  HandSummary,
  PlayerDraft,
  PlayerType,
  Position,
  SizeUnit,
  TournamentStage,
  UserProfile,
} from './mockApi'

type BackendHand = {
  id: string
  userId?: string
  gameType?: GameType
  tournamentStage?: TournamentStage
  blindLevel?: string
  effectiveStack?: number | string
  boardFlop?: string
  boardTurn?: string | null
  boardRiver?: string | null
  overallGtoScore?: number | string | null
  overallSuggestion?: string | null
  createdAt?: string
  updatedAt?: string
  handName?: string
  heroCards?: string
}

type BackendPlayer = {
  id: string
  name: string
  playerType?: PlayerType
  rangeNotes?: string | null
  position?: Position
  startingStack?: number | string
  isHero?: boolean
  holeCards?: string | null
  createdAt?: string
  updatedAt?: string
}

type BackendAction = {
  id: string
  handId: string
  playerId: string
  street: HandAction['street']
  actionType: ActionType
  actionSize?: number | string | null
  sizeUnit?: SizeUnit
  actionOrder?: number
  analysisStatus?: HandAction['analysisStatus']
  analysis?: Partial<ActionAnalysis>
}

type BackendAuthResponse = {
  accessToken?: string
  token?: string
  user?: {
    id: string
    username: string
    email: string
    tokenExpiresAt?: string
  }
  profile?: UserProfile
}

type BackendListResponse<T> = T[] | { data?: T[]; total?: number; page?: number; limit?: number }

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')
const storageTokenKey = 'poke-review-api-token'
const usingBackend = Boolean(apiBaseUrl)

class BackendRequestError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

let activeToken = localStorage.getItem(storageTokenKey) || ''
let backendUnavailable = false
let backendProfile: UserProfile | null = null
let backendHand: HandInfo | null = null
let backendPlayers: HandPlayer[] = []
let backendActions: HandAction[] = []

const toNumber = (value: unknown, fallback = 0) => {
  if (value === '' || value === null || value === undefined) return fallback
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const parseBlindLevel = (blindLevel?: string) => {
  const [smallBlind, bigBlind, ante] = (blindLevel ?? '').match(/\d+(?:\.\d+)?/g)?.map(Number) ?? []
  return {
    smallBlind: smallBlind ?? 100,
    bigBlind: bigBlind ?? 200,
    ante: ante ?? '',
  }
}

const buildBlindLevel = (hand: HandInfo) => {
  const anteText = hand.ante === '' ? '' : ` ante ${hand.ante}`
  return `${hand.smallBlind || 100}/${hand.bigBlind || 200}${anteText}`
}

const getHeroCards = () => backendHand?.heroCards || backendPlayers.find((player) => player.isHero)?.holeCards || ''

const withFallback = async <T>(operation: () => Promise<T>, fallback: () => Promise<T>): Promise<T> => {
  if (!usingBackend || backendUnavailable) return fallback()
  try {
    return await operation()
  } catch (error) {
    console.warn('Backend API unavailable, falling back to mock data.', error)
    if (!(error instanceof BackendRequestError) || error.status >= 500) {
      backendUnavailable = true
    }
    return fallback()
  }
}

const apiFetch = async <T>(path: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json')
  if (activeToken) headers.set('Authorization', `Bearer ${activeToken}`)

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new BackendRequestError(response.status, message || `Backend request failed: ${response.status}`)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

const normalizeAuth = (response: BackendAuthResponse, fallbackUsername: string): AuthState => {
  const profileSource = response.profile ?? response.user
  const profile: UserProfile = {
    id: profileSource?.id ?? 'backend-user',
    username: profileSource?.username ?? fallbackUsername,
    email: profileSource?.email ?? '',
    tokenExpiresAt: profileSource?.tokenExpiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }
  const token = response.accessToken ?? response.token ?? ''
  activeToken = token
  backendProfile = profile
  if (token) localStorage.setItem(storageTokenKey, token)
  return { token, profile }
}

const normalizeHand = (source: BackendHand): HandInfo => {
  const blind = parseBlindLevel(source.blindLevel)
  return {
    id: source.id,
    userId: source.userId ?? backendProfile?.id ?? 'backend-user',
    handName: source.handName ?? `手牌 ${source.id.slice(0, 8)}`,
    source: '',
    gameType: source.gameType ?? 'TOURNAMENT',
    tournamentStage: source.tournamentStage ?? 'FT',
    smallBlind: blind.smallBlind,
    bigBlind: blind.bigBlind,
    ante: blind.ante,
    effectiveStack: toNumber(source.effectiveStack, 35),
    boardFlop: source.boardFlop ?? '',
    boardTurn: source.boardTurn ?? '',
    boardRiver: source.boardRiver ?? '',
    heroCards: source.heroCards ?? getHeroCards(),
    result: '',
    rawHistory: '',
    overallGtoScore: source.overallGtoScore === null ? undefined : toNumber(source.overallGtoScore, undefined as unknown as number),
    overallSuggestion: source.overallSuggestion ?? undefined,
    analysisDirty: false,
    createdAt: source.createdAt ?? new Date().toISOString(),
    updatedAt: source.updatedAt ?? new Date().toISOString(),
  }
}

const normalizePlayer = (source: BackendPlayer, index = 0): HandPlayer => ({
  id: source.id,
  name: source.name,
  position: source.position ?? (['BTN', 'SB', 'BB', 'CO', 'HJ', 'LJ'] as Position[])[index % 6],
  playerType: source.playerType ?? 'UNKNOWN',
  startingStack: toNumber(source.startingStack, 30),
  isHero: Boolean(source.isHero),
  holeCards: source.holeCards ?? '',
  rangeNotes: source.rangeNotes ?? '',
})

const normalizeActionAnalysis = (source: Partial<ActionAnalysis> | undefined, actionId: string): ActionAnalysis | undefined => {
  if (!source) return undefined
  const optimalAction = source.optimalAction && ['OPEN', 'CALL', 'RAISE', '3BET', '4BET', 'CHECK', 'BET', 'FOLD', 'ALLIN'].includes(source.optimalAction)
    ? source.optimalAction
    : 'CHECK'
  return {
    id: source.id ?? `analysis-${actionId}`,
    actionId: source.actionId ?? actionId,
    analysisStatus: source.analysisStatus ?? 'COMPLETED',
    evValue: toNumber(source.evValue, 0),
    gtoScore: toNumber(source.gtoScore, 0),
    optimalAction: optimalAction as ActionType,
    suggestion: source.suggestion ?? '',
    rangeAnalysis: source.rangeAnalysis ?? source.suggestion ?? '',
    betSizingReview: source.betSizingReview ?? '后端分析暂未返回下注尺度拆分。',
    exploitAdjustment: source.exploitAdjustment ?? '后端分析暂未返回 exploit 拆分。',
    icmImpact: source.icmImpact ?? '后端分析暂未返回 ICM 拆分。',
    oneLineConclusion: source.oneLineConclusion ?? source.suggestion ?? '后端分析已完成。',
  }
}

const normalizeAction = (source: BackendAction): HandAction => {
  const analysis = normalizeActionAnalysis(source.analysis, source.id)
  return {
    id: source.id,
    handId: source.handId,
    playerId: source.playerId,
    street: source.street,
    actionType: source.actionType,
    actionSize: toNumber(source.actionSize, 0),
    sizeUnit: source.sizeUnit ?? 'BB',
    actionOrder: source.actionOrder ?? 1,
    analysisStatus: source.analysisStatus ?? analysis?.analysisStatus ?? 'PENDING',
    analysis,
  }
}

const handToSummary = (hand: HandInfo): HandSummary => ({
  id: hand.id,
  title: hand.handName || `手牌 ${hand.id.slice(0, 8)}`,
  gameType: hand.gameType,
  stage: hand.tournamentStage,
  heroCards: hand.heroCards,
  board: `${hand.boardFlop || '-'} · ${hand.boardTurn || '-'} · ${hand.boardRiver || '-'}`,
  opponentType: 'UNKNOWN',
  score: hand.overallGtoScore ?? 0,
  lowestAction: '未分析',
  createdAt: hand.createdAt,
  analysisDirty: hand.analysisDirty,
})

const createBackendHand = async (payload: HandInfo) => {
  const saved = await apiFetch<BackendHand>('/api/hands', {
    method: 'POST',
    body: JSON.stringify({
      gameType: payload.gameType,
      tournamentStage: payload.tournamentStage,
      blindLevel: buildBlindLevel(payload),
      effectiveStack: payload.effectiveStack,
      boardFlop: payload.boardFlop,
      boardTurn: payload.boardTurn,
      boardRiver: payload.boardRiver,
    }),
  })
  backendHand = { ...normalizeHand(saved), handName: payload.handName, heroCards: payload.heroCards }
  return backendHand
}

const updateBackendHand = async (payload: HandInfo) => {
  const saved = await apiFetch<BackendHand>(`/api/hands/${payload.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      gameType: payload.gameType,
      tournamentStage: payload.tournamentStage,
      blindLevel: buildBlindLevel(payload),
      effectiveStack: payload.effectiveStack,
      boardFlop: payload.boardFlop,
      boardTurn: payload.boardTurn,
      boardRiver: payload.boardRiver,
      overallGtoScore: payload.overallGtoScore,
      overallSuggestion: payload.overallSuggestion,
    }),
  })
  backendHand = { ...normalizeHand(saved), handName: payload.handName, heroCards: payload.heroCards, analysisDirty: true }
  return backendHand
}

export const apiClient = {
  async register(payload: { username: string; email: string; password: string }) {
    return withFallback(
      async () => normalizeAuth(await apiFetch<BackendAuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }), payload.username),
      () => mockApi.register(payload),
    )
  },

  async login(payload: { username: string; password: string }) {
    return withFallback(
      async () => normalizeAuth(await apiFetch<BackendAuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }), payload.username),
      () => mockApi.login(payload),
    )
  },

  async logout() {
    activeToken = ''
    backendProfile = null
    localStorage.removeItem(storageTokenKey)
    return mockApi.logout()
  },

  async getProfile() {
    return withFallback(
      async () => {
        if (backendProfile) return backendProfile
        const fallback = await mockApi.getProfile()
        backendProfile = fallback
        return fallback
      },
      () => mockApi.getProfile(),
    )
  },

  async changePassword() {
    return mockApi.changePassword()
  },

  async getReviewDraft() {
    return withFallback(
      async () => {
        const handsResponse = await apiFetch<BackendListResponse<BackendHand>>('/api/hands?limit=1')
        const hands = Array.isArray(handsResponse) ? handsResponse : handsResponse.data ?? []
        if (!hands[0]) {
          const fallback = await mockApi.getReviewDraft()
          backendHand = fallback.hand
          backendPlayers = fallback.players
          backendActions = fallback.actions
          return fallback
        }
        backendHand = normalizeHand(hands[0])
        const [players, actions] = await Promise.all([
          apiFetch<BackendPlayer[]>('/api/players'),
          apiFetch<BackendAction[]>(`/api/actions/hand/${backendHand.id}`),
        ])
        backendPlayers = players.map(normalizePlayer)
        backendActions = actions.map(normalizeAction)
        backendHand = { ...backendHand, heroCards: getHeroCards() }
        return { hand: backendHand, players: backendPlayers, actions: backendActions }
      },
      () => mockApi.getReviewDraft(),
    )
  },

  async listTableTemplates() {
    return mockApi.listTableTemplates()
  },

  async saveTableTemplate(payload: Parameters<typeof mockApi.saveTableTemplate>[0]) {
    return mockApi.saveTableTemplate(payload)
  },

  async applyTableTemplate(templateId: string) {
    return mockApi.applyTableTemplate(templateId)
  },

  async startTableDraft(payload: Parameters<typeof mockApi.startTableDraft>[0]) {
    backendPlayers = payload.players
    backendActions = []
    if (backendHand) backendHand = { ...backendHand, analysisDirty: true }
    return mockApi.startTableDraft(payload)
  },

  async createHand(payload: HandInfo) {
    return withFallback(() => createBackendHand(payload), () => mockApi.createHand(payload))
  },

  async updateHand(payload: HandInfo) {
    return withFallback(() => updateBackendHand(payload), () => mockApi.updateHand(payload))
  },

  async listHands(filters?: HandFilters) {
    return withFallback(
      async () => {
        const response = await apiFetch<BackendListResponse<BackendHand>>('/api/hands?limit=100')
        const hands = Array.isArray(response) ? response : response.data ?? []
        let summaries = hands.map((item) => handToSummary(normalizeHand(item)))
        if (filters?.search) {
          const search = filters.search.toLowerCase()
          summaries = summaries.filter((item) => `${item.title} ${item.heroCards} ${item.board}`.toLowerCase().includes(search))
        }
        if (filters?.gameType && filters.gameType !== 'ALL') summaries = summaries.filter((item) => item.gameType === filters.gameType)
        if (filters?.stage && filters.stage !== 'ALL') summaries = summaries.filter((item) => item.stage === filters.stage)
        if (typeof filters?.maxScore === 'number') summaries = summaries.filter((item) => item.score <= filters.maxScore!)
        return summaries
      },
      () => mockApi.listHands(filters),
    )
  },

  async getHandDetail(handId: string) {
    return withFallback(
      async () => {
        const [hand, players, actions] = await Promise.all([
          apiFetch<BackendHand>(`/api/hands/${handId}`),
          apiFetch<BackendPlayer[]>('/api/players'),
          apiFetch<BackendAction[]>(`/api/actions/hand/${handId}`),
        ])
        backendHand = normalizeHand(hand)
        backendPlayers = players.map(normalizePlayer)
        backendActions = actions.map(normalizeAction)
        backendHand = { ...backendHand, heroCards: getHeroCards() }
        return { summary: handToSummary(backendHand), hand: backendHand, players: backendPlayers, actions: backendActions }
      },
      () => mockApi.getHandDetail(handId),
    )
  },

  async deleteHand(handId: string) {
    return withFallback(
      async () => {
        await apiFetch(`/api/hands/${handId}`, { method: 'DELETE' })
        return this.listHands()
      },
      () => mockApi.deleteHand(handId),
    )
  },

  async addPlayer(payload: PlayerDraft) {
    return withFallback(
      async () => {
        const player = normalizePlayer(await apiFetch<BackendPlayer>('/api/players', { method: 'POST', body: JSON.stringify(payload) }), backendPlayers.length)
        const nextPlayers = payload.isHero ? backendPlayers.map((item) => ({ ...item, isHero: false })).concat({ ...player, ...payload }) : backendPlayers.concat({ ...player, ...payload })
        backendPlayers = nextPlayers
        if (backendHand) backendHand = { ...backendHand, analysisDirty: true }
        return { player: nextPlayers.at(-1)!, players: nextPlayers, hand: backendHand! }
      },
      () => mockApi.addPlayer(payload),
    )
  },

  async updatePlayer(playerId: string, payload: PlayerDraft) {
    return withFallback(
      async () => {
        const saved = normalizePlayer(await apiFetch<BackendPlayer>(`/api/players/${playerId}`, { method: 'PUT', body: JSON.stringify(payload) }))
        backendPlayers = backendPlayers.map((player) => (player.id === playerId ? { ...saved, ...payload, id: playerId } : payload.isHero ? { ...player, isHero: false } : player))
        if (backendHand) backendHand = { ...backendHand, analysisDirty: true }
        return { players: backendPlayers, hand: backendHand! }
      },
      () => mockApi.updatePlayer(playerId, payload),
    )
  },

  async deletePlayer(playerId: string) {
    return withFallback(
      async () => {
        await apiFetch(`/api/players/${playerId}`, { method: 'DELETE' })
        backendPlayers = backendPlayers.filter((player) => player.id !== playerId)
        backendActions = backendActions.filter((action) => action.playerId !== playerId)
        if (backendHand) backendHand = { ...backendHand, analysisDirty: true }
        return { players: backendPlayers, actions: backendActions, hand: backendHand! }
      },
      () => mockApi.deletePlayer(playerId),
    )
  },

  async addAction(payload: ActionDraft) {
    return withFallback(
      async () => {
        const handId = backendHand?.id
        if (!handId) throw new Error('No backend hand is available for action creation.')
        const saved = normalizeAction(await apiFetch<BackendAction>('/api/actions', {
          method: 'POST',
          body: JSON.stringify({ ...payload, handId, actionOrder: backendActions.length + 1 }),
        }))
        backendActions = backendActions.concat(saved)
        if (backendHand) backendHand = { ...backendHand, analysisDirty: true }
        return { action: saved, actions: backendActions, hand: backendHand! }
      },
      () => mockApi.addAction(payload),
    )
  },

  async updateAction(actionId: string, payload: ActionDraft) {
    return withFallback(
      async () => {
        const saved = normalizeAction(await apiFetch<BackendAction>(`/api/actions/${actionId}`, { method: 'PUT', body: JSON.stringify(payload) }))
        backendActions = backendActions.map((action) => (action.id === actionId ? saved : action))
        if (backendHand) backendHand = { ...backendHand, analysisDirty: true }
        return { actions: backendActions, hand: backendHand! }
      },
      () => mockApi.updateAction(actionId, payload),
    )
  },

  async deleteAction(actionId: string) {
    return withFallback(
      async () => {
        await apiFetch(`/api/actions/${actionId}`, { method: 'DELETE' })
        backendActions = backendActions.filter((action) => action.id !== actionId).map((action, index) => ({ ...action, actionOrder: index + 1 }))
        if (backendHand) backendHand = { ...backendHand, analysisDirty: true }
        return { actions: backendActions, hand: backendHand! }
      },
      () => mockApi.deleteAction(actionId),
    )
  },

  async analyzeAction(actionId: string) {
    return withFallback(
      async () => {
        const action = backendActions.find((item) => item.id === actionId)
        const analysis = normalizeActionAnalysis(await apiFetch<ActionAnalysis>(`/api/analysis/action/${actionId}`, {
          method: 'POST',
          body: JSON.stringify({
            ...backendHand,
            ...action,
            blindLevel: backendHand ? buildBlindLevel(backendHand) : undefined,
            heroHand: getHeroCards(),
          }),
        }), actionId)
        backendActions = backendActions.map((item) => (item.id === actionId ? { ...item, analysisStatus: analysis?.analysisStatus ?? 'COMPLETED', analysis } : item))
        if (backendHand) backendHand = { ...backendHand, analysisDirty: false }
        return backendActions.find((item) => item.id === actionId)
      },
      () => mockApi.analyzeAction(actionId),
    )
  },

  async getActionAnalysis(actionId: string) {
    return withFallback(() => apiFetch<ActionAnalysis>(`/api/analysis/action/${actionId}`), () => mockApi.getActionAnalysis(actionId))
  },

  async analyzeHand() {
    return withFallback(
      async () => {
        const result = await apiFetch<{ analyses?: ActionAnalysis[]; overallGtoScore?: number }>('/api/analysis/hand', {
          method: 'POST',
          body: JSON.stringify({ ...backendHand, actions: backendActions, heroHand: getHeroCards(), blindLevel: backendHand ? buildBlindLevel(backendHand) : undefined }),
        })
        backendActions = backendActions.map((action) => {
          const analysis = normalizeActionAnalysis(result.analyses?.find((item) => item.actionId === action.id), action.id)
          return analysis ? { ...action, analysisStatus: analysis.analysisStatus, analysis } : action
        })
        if (backendHand) {
          backendHand = {
            ...backendHand,
            overallGtoScore: result.overallGtoScore ?? backendHand.overallGtoScore,
            overallSuggestion: '后端整手牌分析已完成。',
            analysisDirty: false,
          }
        }
        return { hand: backendHand!, actions: backendActions }
      },
      () => mockApi.analyzeHand(),
    )
  },

  async getActionAdvice(payload: ActionCoachRequest): Promise<ActionCoachResult> {
    return mockApi.getActionAdvice(payload)
  },

  async reviewActionLine(payload: ActionCoachRequest): Promise<ActionCoachResult> {
    return mockApi.reviewActionLine(payload)
  },

  listOpponents: mockApi.listOpponents,
  getOpponent: mockApi.getOpponent,
  analyzeOpponent: mockApi.analyzeOpponent,
  getOpponentPatterns: mockApi.getOpponentPatterns,
  getOpponentHands: mockApi.getOpponentHands,
  listStrategies: mockApi.listStrategies,
  createStrategy: mockApi.createStrategy,
  updateStrategy: mockApi.updateStrategy,
  deleteStrategy: mockApi.deleteStrategy,
  toggleStrategy: mockApi.toggleStrategy,
  createStrategyEvaluation: mockApi.createStrategyEvaluation,
  listStrategyEvaluations: mockApi.listStrategyEvaluations,
  getStatistics: mockApi.getStatistics,
}
