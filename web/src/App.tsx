import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import type { FormEvent } from 'react'
import {
  Bot,
  Brain,
  CheckCircle2,
  ChevronRight,
  Circle,
  X,
  Clock3,
  KeyRound,
  Library,
  LineChart,
  Loader2,
  LogOut,
  Menu,
  Pencil,
  Plus,
  Save,
  Search,
  Sparkles,
  Target,
  Trash2,
  UserCircle,
  Users,
  Wallet,
} from 'lucide-react'
import './App.css'
import { apiClient } from './apiClient'
import type {
  ActionDraft,
  ActionType,
  AdjustmentScope,
  AdjustmentType,
  AuthState,
  GameType,
  HandAction,
  HandFilters,
  HandInfo,
  HandPlayer,
  HandSummary,
  OpponentProfile,
  PlayerDraft,
  PlayerType,
  Position,
  SectionKey,
  SizeUnit,
  StrategyAdjustment,
  StrategyDraft,
  StrategyEvaluation,
  StrategyOutcome,
  TableTemplate,
  Street,
  TournamentStage,
  UserProfile,
} from './mockApi'

type ReviewStep = 0 | 1 | 2 | 3 | 4
type NoticeType = 'success' | 'info' | 'error'
type Notice = { text: string; type: NoticeType } | null
type TableSize = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
type CardSuit = '黑桃' | '红桃' | '方块' | '梅花'
type CardRank = 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2'
type CardValue = `${CardSuit}${CardRank}` | ''
type RouteState = { section: SectionKey; reviewStep: ReviewStep }
type DealtStreet = Extract<Street, 'FLOP' | 'TURN' | 'RIVER'>

const navItems: Array<{ key: SectionKey; label: string; icon: typeof Brain }> = [
  { key: 'auth', label: '用户中心', icon: UserCircle },
  { key: 'review', label: '复盘工作台', icon: Brain },
  { key: 'library', label: '手牌库', icon: Library },
  { key: 'opponents', label: '对手画像', icon: Users },
  { key: 'strategies', label: '策略库', icon: Target },
  { key: 'bankroll', label: '资金管理', icon: Wallet },
  { key: 'stats', label: 'AI 结果库', icon: LineChart },
]
const disabledNavSections = new Set<SectionKey>(['auth', 'opponents', 'strategies', 'bankroll'])

const reviewSteps = [
  { label: '1. 牌桌入口' },
  { label: '2. 牌桌与玩家信息' },
  { label: '3. 手牌信息录入' },
  { label: '4. 行动信息' },
  { label: '5. AI 分析结果' },
]

const sectionPaths: Record<SectionKey, string> = {
  auth: '/auth',
  review: '/review/table',
  library: '/library',
  opponents: '/opponents',
  strategies: '/strategies',
  bankroll: '/bankroll',
  stats: '/stats',
}

const reviewStepSlugs: Record<ReviewStep, string> = {
  0: 'table',
  1: 'players',
  2: 'hand',
  3: 'actions',
  4: 'analysis',
}

const reviewStepBySlug: Record<string, ReviewStep> = {
  table: 0,
  players: 1,
  hand: 2,
  actions: 3,
  analysis: 4,
}

const pathForRoute = ({ section, reviewStep }: RouteState) =>
  section === 'review' ? `/review/${reviewStepSlugs[reviewStep]}` : sectionPaths[section]

const parseRoute = (pathname: string): RouteState => {
  const [sectionSlug, reviewSlug] = pathname.replace(/^\/+|\/+$/g, '').split('/')
  if (!sectionSlug) return { section: 'review', reviewStep: 0 }
  if (sectionSlug === 'review') return { section: 'review', reviewStep: reviewStepBySlug[reviewSlug ?? 'table'] ?? 0 }
  const section = (Object.keys(sectionPaths) as SectionKey[]).find((key) => sectionPaths[key] === `/${sectionSlug}`)
  return section ? { section, reviewStep: 0 } : { section: 'review', reviewStep: 0 }
}

const getInitialRoutePath = () => pathForRoute(parseRoute(window.location.pathname))
const routeChangeEvent = 'poker-review-route-change'
const subscribeToRoute = (onStoreChange: () => void) => {
  const notify = () => onStoreChange()
  window.addEventListener('popstate', notify)
  window.addEventListener(routeChangeEvent, notify)
  return () => {
    window.removeEventListener('popstate', notify)
    window.removeEventListener(routeChangeEvent, notify)
  }
}
const getRouteSnapshot = () => getInitialRoutePath()
const getServerRouteSnapshot = () => sectionPaths.review
const updateBrowserRoute = (nextPath: string, replace = false) => {
  window.history[replace ? 'replaceState' : 'pushState'](null, '', nextPath)
  window.dispatchEvent(new Event(routeChangeEvent))
}

const playerTypeLabels: Record<PlayerType, string> = {
  TIGHT_AGGRESSIVE: '紧凶',
  LOOSE_AGGRESSIVE: '松凶',
  TIGHT_PASSIVE: '紧弱',
  LOOSE_PASSIVE: '松弱',
  GTO: 'GTO',
  UNKNOWN: '未知',
}

const gameTypeLabels: Record<GameType, string> = {
  TOURNAMENT: '锦标赛',
  CASH: '现金局',
}

const tournamentStageLabels: Record<TournamentStage, string> = {
  EARLY: '前期',
  BUBBLE: '泡沫期',
  ITM: '奖励圈',
  FT: '决赛桌',
}

const actionTypeLabels: Record<ActionType, string> = {
  OPEN: '开池',
  CALL: '跟注',
  RAISE: '加注',
  '3BET': '再加注',
  '4BET': '四次加注',
  CHECK: '过牌',
  BET: '下注',
  FOLD: '弃牌',
  ALLIN: '全下',
}

const patternTypeLabels = {
  PREFLOP_OPEN: '翻前开池',
  CBET: '持续下注',
  CHECK_RAISE: '过牌加注',
  RIVER_ALLIN: '河牌全下',
  '3BET': '再加注',
  '4BET': '四次加注',
  FLOAT: '浮动跟注',
  SLOW_PLAY: '慢打',
} as const

const adjustmentTypeLabels: Record<AdjustmentType, string> = {
  PREFLOP: '翻前',
  FLOP: '翻牌',
  TURN: '转牌',
  RIVER: '河牌',
  GENERAL: '通用',
}

const adjustmentScopeLabels: Record<AdjustmentScope, string> = {
  OPEN: '开池',
  '3BET': '再加注',
  CALL: '跟注',
  BET: '下注',
  RAISE: '加注',
  CHECK: '过牌',
  FOLD: '弃牌',
}

const strategyOutcomeLabels: Record<StrategyOutcome, string> = {
  WIN: '盈利',
  LOSS: '亏损',
  DRAW: '持平',
}

const boardTextureLabels: Record<string, string> = {
  ANY: '不限牌面',
  dry: '干燥牌面',
  wet: '湿润牌面',
}

const positionLabels: Record<Position, string> = {
  UTG: 'UTG',
  UTG1: 'UTG+1',
  UTG2: 'UTG+2',
  LJ: 'LJ',
  HJ: 'HJ',
  CO: 'CO',
  BTN: 'Button',
  SB: 'SB',
  BB: 'BB',
}

const tablePositions: Record<TableSize, Position[]> = {
  2: ['BTN', 'BB'],
  3: ['BTN', 'SB', 'BB'],
  4: ['CO', 'BTN', 'SB', 'BB'],
  5: ['HJ', 'CO', 'BTN', 'SB', 'BB'],
  6: ['LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  7: ['UTG', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  8: ['UTG', 'UTG1', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  9: ['UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
}
const preflopActionPositions: Position[] = ['UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB']
const postflopActionPositions: Position[] = ['SB', 'BB', 'UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN']
const tableSizeOptions: TableSize[] = [2, 3, 4, 5, 6, 7, 8, 9]
const toTableSize = (value: number): TableSize => (tableSizeOptions.includes(value as TableSize) ? (value as TableSize) : 6)

const streetLabels: Record<Street, string> = {
  PREFLOP: '翻前',
  FLOP: '翻牌',
  TURN: '转牌',
  RIVER: '河牌',
}
const streetOrder: Street[] = ['PREFLOP', 'FLOP', 'TURN', 'RIVER']
const previousStreets: Record<Street, Street[]> = {
  PREFLOP: [],
  FLOP: ['PREFLOP'],
  TURN: ['PREFLOP', 'FLOP'],
  RIVER: ['PREFLOP', 'FLOP', 'TURN'],
}
const actionTypeOptionsByStreet: Record<Street, ActionType[]> = {
  PREFLOP: ['FOLD', 'CHECK', 'OPEN', 'CALL', 'RAISE', '3BET', '4BET', 'ALLIN'],
  FLOP: ['CHECK', 'BET', 'CALL', 'RAISE', 'FOLD', 'ALLIN'],
  TURN: ['CHECK', 'BET', 'CALL', 'RAISE', 'FOLD', 'ALLIN'],
  RIVER: ['CHECK', 'BET', 'CALL', 'RAISE', 'FOLD', 'ALLIN'],
}
const defaultActionTypeByStreet: Record<Street, ActionType> = {
  PREFLOP: 'FOLD',
  FLOP: 'CHECK',
  TURN: 'CHECK',
  RIVER: 'CHECK',
}
const nonSizingActionTypes = new Set<ActionType>(['FOLD', 'CHECK'])

const suitOptions: CardSuit[] = ['黑桃', '红桃', '方块', '梅花']
const rankOptions: CardRank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']
const suitImages: Record<CardSuit, string> = {
  黑桃: '/suits/spade.svg',
  红桃: '/suits/heart.svg',
  方块: '/suits/diamond.svg',
  梅花: '/suits/club.svg',
}

const splitCards = (value: string) => value.split(/\s+/).filter(Boolean)
const readCard = (value: string): { suit: CardSuit | ''; rank: CardRank | '' } => {
  const suit = suitOptions.find((item) => value.startsWith(item)) ?? ''
  const rawRank = suit ? value.slice(suit.length) : value.startsWith('·') ? value.slice(1) : ''
  return {
    suit,
    rank: rankOptions.includes(rawRank as CardRank) ? (rawRank as CardRank) : '',
  }
}
const writeCards = (cards: string[]) => cards.filter((card) => card && card !== '·').join(' ')
const replaceCardAt = (value: string, index: number, nextCard: string) => {
  const cards = splitCards(value)
  cards[index] = nextCard
  return writeCards(cards)
}
const hasCompleteCards = (value: string, count: number) =>
  splitCards(value).length === count && splitCards(value).every((card) => {
    const parsed = readCard(card)
    return Boolean(parsed.suit && parsed.rank)
  })
const sortPlayersByPosition = (players: HandPlayer[], positions: Position[]) =>
  [...players].sort((first, second) => {
    const firstIndex = positions.indexOf(first.position)
    const secondIndex = positions.indexOf(second.position)
    return (firstIndex === -1 ? 99 : firstIndex) - (secondIndex === -1 ? 99 : secondIndex)
  })
const getPlayersForStreet = (street: Street, players: HandPlayer[], actions: HandAction[], positions: Position[]) => {
  const foldedPlayerIds = new Set(
    actions
      .filter((action) => previousStreets[street].includes(action.street) && action.actionType === 'FOLD')
      .map((action) => action.playerId),
  )
  const actionPositions = street === 'PREFLOP' ? preflopActionPositions : postflopActionPositions
  const streetPositions = actionPositions.filter((position) => positions.includes(position))
  return sortPlayersByPosition(players.filter((player) => !foldedPlayerIds.has(player.id)), streetPositions)
}
const getDefaultActionSize = (street: Street, actionType: ActionType) => (nonSizingActionTypes.has(actionType) ? 0 : street === 'PREFLOP' ? 2.2 : 1)
const createActionDraft = (street: Street, playerId = '', actionType = defaultActionTypeByStreet[street]): ActionDraft => ({
  playerId,
  street,
  actionType,
  actionSize: getDefaultActionSize(street, actionType),
  sizeUnit: 'BB',
})
const actionDraftKey = (street: Street, playerId: string) => `${street}:${playerId}`

const emptyPlayer: PlayerDraft = {
  name: '',
  position: 'BTN',
  playerType: 'UNKNOWN',
  startingStack: 30,
  isHero: false,
  holeCards: '',
  rangeNotes: '',
}

const emptyStrategyDraft: StrategyDraft = {
  playerId: '',
  adjustmentType: 'PREFLOP',
  adjustmentScope: '3BET',
  originalStrategy: '标准 GTO 策略',
  adjustedStrategy: '',
  reason: '',
  expectedEvImprovement: 1.5,
  confidenceLevel: 70,
}

function App() {
  const routePath = useSyncExternalStore(subscribeToRoute, getRouteSnapshot, getServerRouteSnapshot)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const [auth, setAuth] = useState<AuthState | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authForm, setAuthForm] = useState({ username: 'tree', email: 'tree@example.com', password: 'password123', newPassword: '' })

  const [hand, setHand] = useState<HandInfo | null>(null)
  const [players, setPlayers] = useState<HandPlayer[]>([])
  const [tableSize, setTableSize] = useState<TableSize>(6)
  const [tableTemplates, setTableTemplates] = useState<TableTemplate[]>([])
  const [selectedTableTemplateId, setSelectedTableTemplateId] = useState('')
  const [tableTemplateName, setTableTemplateName] = useState('默认 6 人桌 · FT 常用牌桌')
  const [tableEntryMode, setTableEntryMode] = useState<'create' | 'load' | null>(null)
  const [actions, setActions] = useState<HandAction[]>([])
  const [selectedActionId, setSelectedActionId] = useState('')
  const [playerDraft, setPlayerDraft] = useState<PlayerDraft>(emptyPlayer)
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null)
  const [isAddingPlayer, setIsAddingPlayer] = useState(false)
  const [actionDrafts, setActionDrafts] = useState<Record<string, ActionDraft>>({})
  const [editingActionId, setEditingActionId] = useState<string | null>(null)
  const [viewingPlayerId, setViewingPlayerId] = useState<string | null>(null)
  const [editingBoardStreet, setEditingBoardStreet] = useState<DealtStreet | null>(null)

  const [handFilters, setHandFilters] = useState<HandFilters>({ search: '', gameType: 'ALL', stage: 'ALL', opponentType: 'ALL' })
  const [handList, setHandList] = useState<HandSummary[]>([])

  const [opponents, setOpponents] = useState<OpponentProfile[]>([])
  const [selectedOpponentId, setSelectedOpponentId] = useState('')
  const [opponentHands, setOpponentHands] = useState<HandSummary[]>([])

  const [strategies, setStrategies] = useState<StrategyAdjustment[]>([])
  const [strategyDraft, setStrategyDraft] = useState<StrategyDraft>(emptyStrategyDraft)
  const [editingStrategyId, setEditingStrategyId] = useState<string | null>(null)
  const [evaluationStrategyId, setEvaluationStrategyId] = useState('')
  const [evaluations, setEvaluations] = useState<StrategyEvaluation[]>([])
  const [evaluationDraft, setEvaluationDraft] = useState({
    actualEv: 18.5,
    expectedEv: 16,
    outcome: 'WIN' as StrategyOutcome,
    wasAdjustmentApplied: true,
    effectivenessRating: 5,
    notes: '成功应用策略调整。',
  })

  const selectedAction = actions.find((action) => action.id === selectedActionId) ?? actions[0]
  const analyzedActions = actions.filter((action) => action.analysis)
  const hasAiResults = analyzedActions.length > 0 || Boolean(hand?.overallSuggestion)
  const selectedOpponent = opponents.find((opponent) => opponent.id === selectedOpponentId) ?? opponents[0]
  const selectedStrategy = strategies.find((strategy) => strategy.id === evaluationStrategyId) ?? strategies[0]
  const availablePositions = tablePositions[tableSize]
  const tableIsFull = players.length >= tableSize
  const playerDraftPosition = availablePositions.includes(playerDraft.position) ? playerDraft.position : availablePositions[0]
  const visiblePlayers = [...players].sort((first, second) => {
    const firstIndex = availablePositions.indexOf(first.position)
    const secondIndex = availablePositions.indexOf(second.position)
    return (firstIndex === -1 ? 99 : firstIndex) - (secondIndex === -1 ? 99 : secondIndex)
  })
  const firstOpenPosition = availablePositions.find((position) => !players.some((player) => player.position === position)) ?? availablePositions[0]
  const { section: activeSection, reviewStep } = useMemo(() => parseRoute(routePath), [routePath])

  const activeTitle = useMemo(() => {
    if (activeSection === 'review') return reviewSteps[reviewStep].label.replace(/^\d+\.\s/, '')
    if (activeSection === 'auth') return '用户中心'
    if (activeSection === 'library') return '手牌库'
    if (activeSection === 'opponents') return '对手画像'
    if (activeSection === 'strategies') return '策略库'
    if (activeSection === 'bankroll') return '资金管理'
    return 'AI 结果库'
  }, [activeSection, reviewStep])

  useEffect(() => {
    const load = async () => {
      const [profileData, draft, hands, opponentData, strategyData, evaluationData] = await Promise.all([
        apiClient.getProfile(),
        apiClient.getReviewDraft(),
        apiClient.listHands(),
        apiClient.listOpponents(),
        apiClient.listStrategies(),
        apiClient.listStrategyEvaluations(),
      ])
      const savedTables = await apiClient.listTableTemplates()
      setAuth({ token: 'mock-jwt-token-valid-for-7d', profile: profileData })
      setProfile(profileData)
      setHand(draft.hand)
      setPlayers(draft.players)
      setTableTemplates(savedTables)
      setTableSize(toTableSize(savedTables[0]?.tableSize ?? draft.players.length))
      setSelectedTableTemplateId(savedTables[0]?.id ?? '')
      setTableTemplateName(savedTables[0]?.name ?? '默认 6 人桌 · FT 常用牌桌')
      setActions(draft.actions)
      setSelectedActionId(draft.actions[0]?.id ?? '')
      setActionDrafts({})
      setHandList(hands)
      setOpponents(opponentData)
      setSelectedOpponentId(opponentData[0]?.id ?? '')
      setStrategies(strategyData)
      setEvaluationStrategyId(strategyData[0]?.id ?? '')
      setStrategyDraft({ ...emptyStrategyDraft, playerId: opponentData[0]?.id ?? '' })
      setEvaluations(evaluationData)
      setLoading(false)
    }
    void load()
  }, [])

  useEffect(() => {
    const normalizedPath = getInitialRoutePath()
    if (normalizedPath !== window.location.pathname) {
      updateBrowserRoute(normalizedPath, true)
    }
  }, [])

  useEffect(() => {
    if (!mobileNavOpen) return

    const closeMobileNav = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false)
    }

    window.addEventListener('keydown', closeMobileNav)
    return () => window.removeEventListener('keydown', closeMobileNav)
  }, [mobileNavOpen])

  useEffect(() => {
    if (!selectedOpponentId) return
    void apiClient.getOpponentHands(selectedOpponentId).then(setOpponentHands)
  }, [selectedOpponentId])

  const showNotice = (text: string, type: NoticeType = 'success') => setNotice({ text, type })
  const navigateToRoute = (next: RouteState, options?: { replace?: boolean }) => {
    const nextPath = pathForRoute(next)
    if (nextPath === routePath) return
    updateBrowserRoute(nextPath, options?.replace)
  }
  const updateHand = <Key extends keyof HandInfo>(key: Key, value: HandInfo[Key]) => {
    setHand((current) => (current ? { ...current, [key]: value, analysisDirty: true } : current))
  }
  const getHandInfoValidationMessage = () => {
    if (!hand) return '手牌信息尚未加载完成'
    if (!hand.handName.trim()) return '请填写手牌名称，手牌名称为必选项'
    if (hand.smallBlind === '' || hand.bigBlind === '') return '请填写小盲和大盲，ante 可不填'
    if (!hasCompleteCards(hand.boardFlop, 3)) return '请完整选择翻牌面 3 张公共牌，转牌和河牌可不填'
    return ''
  }
  const getTableValidationMessage = () => {
    if (players.length < 2) return '至少需要录入 2 名玩家才能进入手牌信息'
    if (players.length > tableSize) return `当前已录入 ${players.length} 名玩家，超过 ${tableSize} 人桌容量`
    if (!players.some((player) => player.isHero)) return '请指定 1 名玩家为 Hero'
    return ''
  }
  const isHandInfoComplete = getHandInfoValidationMessage() === ''
  const isTableComplete = getTableValidationMessage() === ''

  useEffect(() => {
    if (loading || activeSection !== 'review') return
    const replaceReviewStep = (nextStep: ReviewStep) => {
      const nextPath = pathForRoute({ section: 'review', reviewStep: nextStep })
      if (nextPath !== routePath) updateBrowserRoute(nextPath, true)
    }

    if (reviewStep > 1 && !isTableComplete) {
      queueMicrotask(() => replaceReviewStep(1))
      return
    }
    if (reviewStep > 2 && !isHandInfoComplete) {
      queueMicrotask(() => replaceReviewStep(2))
    }
  }, [activeSection, isHandInfoComplete, isTableComplete, loading, reviewStep, routePath])

  const syncReviewState = (next: { hand?: HandInfo; players?: HandPlayer[]; actions?: HandAction[] }) => {
    if (next.hand) setHand(next.hand)
    if (next.players) setPlayers(next.players)
    if (next.actions) {
      setActions(next.actions)
      setSelectedActionId((current) => (next.actions?.some((action) => action.id === current) ? current : next.actions?.[0]?.id ?? ''))
    }
  }

  const refreshHandList = async () => {
    const hands = await apiClient.listHands(handFilters)
    setHandList(hands)
  }

  const refreshStrategies = async () => {
    const [strategyData, evaluationData] = await Promise.all([apiClient.listStrategies(), apiClient.listStrategyEvaluations()])
    setStrategies(strategyData)
    setEvaluations(evaluationData)
    setEvaluationStrategyId((current) => (strategyData.some((strategy) => strategy.id === current) ? current : strategyData[0]?.id ?? ''))
  }

  const submitAuth = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    const result =
      authMode === 'login'
        ? await apiClient.login({ username: authForm.username, password: authForm.password })
        : await apiClient.register({ username: authForm.username, email: authForm.email, password: authForm.password })
    setAuth(result)
    setProfile(result.profile)
    showNotice(authMode === 'login' ? '登录成功，会话有效期 7 天' : '注册成功并自动登录')
    setBusy(false)
  }

  const changePassword = async () => {
    setBusy(true)
    await apiClient.changePassword()
    showNotice('密码已修改')
    setAuthForm({ ...authForm, newPassword: '' })
    setBusy(false)
  }

  const logout = async () => {
    await apiClient.logout()
    setAuth(null)
    setProfile(null)
    showNotice('已登出当前会话', 'info')
  }

  const saveHand = async () => {
    if (!hand) return
    const validationMessage = getHandInfoValidationMessage()
    if (validationMessage) {
      showNotice(validationMessage, 'error')
      return
    }
    setBusy(true)
    const saved = hand.id ? await apiClient.updateHand(hand) : await apiClient.createHand(hand)
    setHand(saved)
    navigateToRoute({ section: 'review', reviewStep: 3 })
    showNotice('手牌信息已保存，分析结果已标记为需重新分析')
    setBusy(false)
    await refreshHandList()
  }

  const saveTableAndContinue = async () => {
    const validationMessage = getTableValidationMessage()
    if (validationMessage) {
      showNotice(validationMessage, 'error')
      return
    }
    await saveCurrentTableTemplate()
    navigateToRoute({ section: 'review', reviewStep: 2 })
  }

  const goToReviewStep = (nextStep: ReviewStep) => {
    if (nextStep > 1 && !isTableComplete) {
      navigateToRoute({ section: 'review', reviewStep: 1 })
      showNotice(getTableValidationMessage(), 'error')
      return
    }
    if (nextStep > 2) {
      const validationMessage = getHandInfoValidationMessage()
      if (validationMessage) {
        navigateToRoute({ section: 'review', reviewStep: 2 })
        showNotice(validationMessage, 'error')
        return
      }
    }
    navigateToRoute({ section: 'review', reviewStep: nextStep })
  }

  const addOrUpdatePlayer = async (event: FormEvent) => {
    event.preventDefault()
    if (!playerDraft.name.trim()) {
      showNotice('请先填写玩家名称', 'error')
      return
    }
    if (!editingPlayerId && tableIsFull) {
      showNotice(`${tableSize} 人桌最多录入 ${tableSize} 名玩家，请先调整桌人数或删除玩家`, 'error')
      return
    }
    const positionOwner = players.find((player) => player.position === playerDraftPosition && player.id !== editingPlayerId)
    if (positionOwner) {
      showNotice(`${positionLabels[playerDraftPosition]} 已有玩家 ${positionOwner.name}，请选择空位或先调整原玩家位置`, 'error')
      return
    }
    setBusy(true)
    const playerPayload = { ...playerDraft, position: playerDraftPosition }
    const result = editingPlayerId
      ? await apiClient.updatePlayer(editingPlayerId, playerPayload)
      : await apiClient.addPlayer(playerPayload)
    syncReviewState(result)
    setSelectedTableTemplateId('')
    setPlayerDraft({ ...emptyPlayer, position: firstOpenPosition })
    setEditingPlayerId(null)
    setIsAddingPlayer(false)
    showNotice(editingPlayerId ? '玩家已更新，手牌标记为需重新分析' : '玩家已添加')
    setBusy(false)
  }

  const editPlayer = (player: HandPlayer) => {
    setPlayerDraft({ ...player, position: availablePositions.includes(player.position) ? player.position : availablePositions[0] })
    setEditingPlayerId(player.id)
    setIsAddingPlayer(false)
  }

  const deletePlayer = async (playerId: string) => {
    setBusy(true)
    const result = await apiClient.deletePlayer(playerId)
    syncReviewState(result)
    setSelectedTableTemplateId('')
    if (editingPlayerId === playerId) {
      setEditingPlayerId(null)
      setPlayerDraft({ ...emptyPlayer, position: firstOpenPosition })
    }
    showNotice('玩家已删除，关联行动已同步移除')
    setBusy(false)
  }

  const startAddPlayer = (position = firstOpenPosition) => {
    if (tableIsFull) {
      showNotice(`当前 ${tableSize} 人桌已满。请先删除玩家，或把桌人数调大。`, 'error')
      return
    }
    setEditingPlayerId(null)
    setPlayerDraft({ ...emptyPlayer, position })
    setIsAddingPlayer(true)
  }

  const cancelPlayerEditing = () => {
    setEditingPlayerId(null)
    setIsAddingPlayer(false)
    setPlayerDraft({ ...emptyPlayer, position: firstOpenPosition })
  }

  const createNewTableDraft = async () => {
    setBusy(true)
    const nextSize: TableSize = 6
    const result = await apiClient.startTableDraft({
      name: '未命名新牌桌',
      tableSize: nextSize,
      players: [],
    })
    syncReviewState(result)
    setTableEntryMode('create')
    setTableSize(nextSize)
    setSelectedTableTemplateId('')
    setTableTemplateName('未命名新牌桌')
    setPlayerDraft({ ...emptyPlayer, position: tablePositions[nextSize][0] })
    setEditingPlayerId(null)
    setIsAddingPlayer(false)
    setActionDrafts({})
    navigateToRoute({ section: 'review', reviewStep: 1 })
    showNotice('已创建空白 6 人桌，请先录入玩家信息')
    setBusy(false)
  }

  const loadSavedTable = async (templateId: string) => {
    if (!templateId) {
      showNotice('请先选择一个已保存牌桌', 'error')
      return
    }
    await applyTableTemplate(templateId, { goToPlayers: true })
  }

  const saveCurrentTableTemplate = async () => {
    const validationMessage = getTableValidationMessage()
    if (validationMessage) {
      showNotice(validationMessage, 'error')
      return
    }
    setBusy(true)
    const template = await apiClient.saveTableTemplate({
      id: selectedTableTemplateId || undefined,
      name: tableTemplateName,
      tableSize,
      players,
    })
    const templates = await apiClient.listTableTemplates()
    setTableTemplates(templates)
    setSelectedTableTemplateId(template.id)
    setTableTemplateName(template.name)
    showNotice(`牌桌「${template.name}」已保存，下次可直接复用`)
    setBusy(false)
  }

  const applyTableTemplate = async (templateId: string, options?: { goToPlayers?: boolean }) => {
    if (!templateId) return
    setBusy(true)
    const result = await apiClient.applyTableTemplate(templateId)
    syncReviewState(result)
    if (result.template) {
      setTableSize(toTableSize(result.template.tableSize))
      setTableEntryMode('load')
      setSelectedTableTemplateId(result.template.id)
      setTableTemplateName(result.template.name)
      setPlayerDraft({ ...emptyPlayer, position: tablePositions[toTableSize(result.template.tableSize)][0] })
      setEditingPlayerId(null)
      setIsAddingPlayer(false)
      setActionDrafts({})
      if (options?.goToPlayers) navigateToRoute({ section: 'review', reviewStep: 1 })
      showNotice(`已载入牌桌「${result.template.name}」，本手牌将复用这些玩家信息`)
    }
    setBusy(false)
  }

  const updateActionDraft = (street: Street, playerId: string, patch: Partial<ActionDraft>, fallback?: ActionDraft) => {
    const key = actionDraftKey(street, playerId)
    setActionDrafts((current) => {
      const base = current[key] ?? fallback ?? createActionDraft(street, playerId)
      const nextActionType = patch.actionType ?? base.actionType
      const next = {
        ...base,
        ...patch,
        playerId,
        street,
      }
      if (patch.actionType && patch.actionSize === undefined) {
        next.actionSize = getDefaultActionSize(street, nextActionType)
      }
      return { ...current, [key]: next }
    })
  }

  const savePlayerAction = async (street: Street, player: HandPlayer, existingAction?: HandAction) => {
    const key = actionDraftKey(street, player.id)
    const draft = actionDrafts[key] ?? (existingAction ? { ...existingAction } : createActionDraft(street, player.id))
    const payload: ActionDraft = {
      playerId: player.id,
      street,
      actionType: draft.actionType,
      actionSize: nonSizingActionTypes.has(draft.actionType) ? 0 : Number(draft.actionSize) || getDefaultActionSize(street, draft.actionType),
      sizeUnit: draft.sizeUnit,
    }
    setBusy(true)
    const result = existingAction ? await apiClient.updateAction(existingAction.id, payload) : await apiClient.addAction(payload)
    syncReviewState(result)
    const savedAction = existingAction ? result.actions.find((action) => action.id === existingAction.id) : result.actions.at(-1)
    setSelectedActionId(savedAction?.id ?? existingAction?.id ?? selectedActionId)
    setEditingActionId(null)
    setActionDrafts((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
    showNotice(existingAction ? '行动已更新，原分析已失效' : '行动已添加，可进行该街道分析')
    setBusy(false)
  }

  const analyzeStreet = async (street: Street) => {
    const targetActions = actions.filter((action) => action.street === street)
    if (targetActions.length === 0) {
      showNotice(`请先保存${streetLabels[street]}行动，再进行分析`, 'error')
      return
    }
    const targetIds = new Set(targetActions.map((action) => action.id))
    setBusy(true)
    setActions((current) => current.map((action) => (targetIds.has(action.id) ? { ...action, analysisStatus: 'PROCESSING' } : action)))
    const analyzed = await Promise.all(targetActions.map((action) => apiClient.analyzeAction(action.id)))
    const analyzedById = new Map(
      analyzed
        .filter((action): action is HandAction => Boolean(action))
        .map((action) => [action.id, action]),
    )
    setActions((current) => current.map((action) => analyzedById.get(action.id) ?? action))
    const nextHand = await apiClient.getReviewDraft()
    setHand(nextHand.hand)
    setActions(nextHand.actions)
    setSelectedActionId(targetActions[0]?.id ?? selectedActionId)
    showNotice(`${streetLabels[street]}行动分析完成`)
    setBusy(false)
    await refreshHandList()
  }

  const analyzeHand = async () => {
    setBusy(true)
    navigateToRoute({ section: 'review', reviewStep: 4 })
    const result = await apiClient.analyzeHand()
    setHand(result.hand)
    setActions(result.actions)
    setSelectedActionId(result.actions[0]?.id ?? '')
    showNotice('整手牌分析完成')
    setBusy(false)
    await refreshHandList()
  }

  const inspectHand = async (handId: string, mode: 'view' | 'edit' = 'view') => {
    const detail = await apiClient.getHandDetail(handId)
    setHand(detail.hand)
    setPlayers(detail.players)
    setActions(detail.actions)
    setSelectedActionId(detail.actions[0]?.id ?? '')
    setTableEntryMode('load')
    navigateToRoute({ section: 'review', reviewStep: mode === 'edit' ? 2 : 4 })
    showNotice(mode === 'edit' ? '已进入手牌编辑模式，保存后会触发重新分析标记' : '已打开完整手牌详情')
  }

  const deleteHand = async (handId: string) => {
    const hands = await apiClient.deleteHand(handId)
    setHandList(hands)
    showNotice('手牌已删除')
  }

  const analyzeOpponent = async (playerId: string) => {
    setBusy(true)
    const next = await apiClient.analyzeOpponent(playerId)
    setOpponents(next)
    showNotice('对手风格分析已刷新')
    setBusy(false)
  }

  const createOrUpdateStrategy = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    const next = editingStrategyId
      ? await apiClient.updateStrategy(editingStrategyId, strategyDraft)
      : await apiClient.createStrategy(strategyDraft)
    setStrategies(next)
    setEvaluationStrategyId((current) => (next.some((strategy) => strategy.id === current) ? current : next.at(-1)?.id ?? ''))
    setStrategyDraft({ ...emptyStrategyDraft, playerId: opponents[0]?.id ?? '' })
    setEditingStrategyId(null)
    navigateToRoute({ section: 'strategies', reviewStep: 0 })
    showNotice(editingStrategyId ? '策略已更新' : '策略调整已创建')
    setBusy(false)
  }

  const createStrategyFromOpponent = async (playerId: string) => {
    const opponent = opponents.find((item) => item.id === playerId)
    setStrategyDraft({
      playerId,
      adjustmentType: 'GENERAL',
      adjustmentScope: 'BET',
      originalStrategy: '维持平衡 GTO 下注频率。',
      adjustedStrategy: opponent?.inferredType === 'TIGHT_PASSIVE' ? '提高 turn 半诈唬加注频率。' : '扩大价值下注，降低边缘 bluff。',
      reason: opponent?.inferredRanges.postflop ?? '',
      expectedEvImprovement: 1.8,
      confidenceLevel: 76,
    })
    setEditingStrategyId(null)
    navigateToRoute({ section: 'strategies', reviewStep: 0 })
    showNotice('已从对手画像填充策略草稿')
  }

  const editStrategy = (strategy: StrategyAdjustment) => {
    setStrategyDraft({
      playerId: strategy.playerId,
      adjustmentType: strategy.adjustmentType,
      adjustmentScope: strategy.adjustmentScope,
      originalStrategy: strategy.originalStrategy,
      adjustedStrategy: strategy.adjustedStrategy,
      reason: strategy.reason,
      expectedEvImprovement: strategy.expectedEvImprovement,
      confidenceLevel: strategy.confidenceLevel,
    })
    setEditingStrategyId(strategy.id)
  }

  const deleteStrategy = async (strategyId: string) => {
    const next = await apiClient.deleteStrategy(strategyId)
    setStrategies(next)
    setEvaluationStrategyId((current) => (next.some((strategy) => strategy.id === current) ? current : next[0]?.id ?? ''))
    setEvaluations(await apiClient.listStrategyEvaluations())
    showNotice('策略已删除，关联评估也已清理')
  }

  const toggleStrategy = async (strategyId: string) => {
    const next = await apiClient.toggleStrategy(strategyId)
    setStrategies(next)
    showNotice('策略启用状态已更新')
  }

  const createEvaluation = async () => {
    if (!selectedStrategy) {
      showNotice('请先创建或选择一个策略，再记录收益评估', 'error')
      return
    }
    const payload = {
      adjustmentId: selectedStrategy.id,
      handId: hand?.id ?? 'hand-draft-001',
      actualEv: evaluationDraft.actualEv,
      expectedEv: evaluationDraft.expectedEv,
      evDifference: Number((evaluationDraft.actualEv - evaluationDraft.expectedEv).toFixed(1)),
      outcome: evaluationDraft.outcome,
      wasAdjustmentApplied: evaluationDraft.wasAdjustmentApplied,
      effectivenessRating: evaluationDraft.effectivenessRating,
      notes: evaluationDraft.notes,
    }
    const result = await apiClient.createStrategyEvaluation(payload)
    setEvaluations(result.evaluations)
    setStrategies(result.strategies)
    showNotice('策略评估已创建')
  }

  const resetHandFilters = async () => {
    const nextFilters: HandFilters = { search: '', gameType: 'ALL', stage: 'ALL', opponentType: 'ALL' }
    setHandFilters(nextFilters)
    setHandList(await apiClient.listHands(nextFilters))
    showNotice('历史筛选已重置', 'info')
  }

  const openReviewWorkspace = () => {
    navigateToRoute({ section: 'review', reviewStep: 0 })
    setTableEntryMode(null)
    setEditingPlayerId(null)
    setIsAddingPlayer(false)
    setEditingActionId(null)
    setViewingPlayerId(null)
    setPlayerDraft({ ...emptyPlayer, position: tablePositions[tableSize][0] })
    setActionDrafts({})
    setSelectedActionId(actions[0]?.id ?? '')
    setNotice(null)
  }

  const handleNavigate = (section: SectionKey) => {
    if (disabledNavSections.has(section) || (section === 'stats' && !hasAiResults)) return
    if (section === 'review') {
      openReviewWorkspace()
    } else {
      navigateToRoute({ section, reviewStep: 0 })
    }
    setMobileNavOpen(false)
  }

  const changeTableSize = (nextSize: TableSize) => {
    const nextPositions = tablePositions[nextSize]
    setTableSize(nextSize)
    setSelectedTableTemplateId('')
    setEditingPlayerId(null)
    setIsAddingPlayer(false)
    setPlayerDraft((current) => ({
      ...current,
      position: nextPositions.includes(current.position) ? current.position : nextPositions[0],
    }))
    if (players.length > nextSize) {
      showNotice(`当前已录入 ${players.length} 名玩家，超过 ${nextSize} 人桌容量，请删除多余玩家或调大人数`, 'error')
    } else {
      showNotice(`已切换为 ${nextSize} 人桌，可用位置已更新`, 'info')
    }
  }

  if (loading || !hand) {
    return (
      <main className="loading-screen">
        <Loader2 className="spin" size={24} />
        正在加载复盘工作台...
      </main>
    )
  }

  const currentHand = hand

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="主导航">
        <button className="brand-block" type="button" onClick={() => handleNavigate('review')}>
          <div className="brand-mark">PR</div>
          <div>
            <strong>PokeReview</strong>
            <span>{auth ? '已登录' : '未登录'}</span>
          </div>
        </button>

        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon
            const disabled = disabledNavSections.has(item.key) || (item.key === 'stats' && !hasAiResults)
            return (
              <button
                aria-disabled={disabled}
                className={`${activeSection === item.key ? 'active' : ''}${disabled ? ' disabled' : ''}`}
                disabled={disabled}
                key={item.key}
                type="button"
                onClick={() => handleNavigate(item.key)}
              >
                <Icon size={18} />
                {item.label}
              </button>
            )
          })}
        </nav>
      </aside>

      <section className="product-surface">
        <header className="topbar">
          <div>
            <span className="eyebrow">{activeSection === 'review' ? `复盘流程 · 第 ${reviewStep + 1} 步` : activeTitle}</span>
            <h1>{activeTitle}</h1>
          </div>
        </header>

        {notice && <div className={`notice ${notice.type}`}>{notice.text}</div>}

        {activeSection === 'auth' && renderAuth()}
        {activeSection === 'review' && renderReview()}
        {activeSection === 'library' && renderLibrary()}
        {activeSection === 'opponents' && renderOpponents()}
        {activeSection === 'strategies' && renderStrategies()}
        {activeSection === 'stats' && renderStats()}
      </section>

      <button
        className="mobile-menu-button"
        type="button"
        aria-label={mobileNavOpen ? '关闭主导航' : '打开主导航'}
        aria-expanded={mobileNavOpen}
        aria-controls="mobile-nav-drawer"
        onClick={() => setMobileNavOpen((isOpen) => !isOpen)}
      >
        {mobileNavOpen ? <X size={21} /> : <Menu size={21} />}
        <span>{mobileNavOpen ? '关闭' : '菜单'}</span>
      </button>

      <button
        className={`mobile-nav-scrim ${mobileNavOpen ? 'open' : ''}`}
        type="button"
        aria-label="关闭主导航"
        onClick={() => setMobileNavOpen(false)}
      />

      <aside id="mobile-nav-drawer" className={`mobile-nav-drawer ${mobileNavOpen ? 'open' : ''}`} aria-label="移动端主导航">
        <button className="brand-block" type="button" onClick={() => handleNavigate('review')}>
          <div className="brand-mark">PR</div>
          <div>
            <strong>PokeReview</strong>
            <span>{auth ? '已登录' : '未登录'}</span>
          </div>
        </button>

        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon
            const disabled = disabledNavSections.has(item.key) || (item.key === 'stats' && !hasAiResults)
            return (
              <button
                aria-disabled={disabled}
                className={`${activeSection === item.key ? 'active' : ''}${disabled ? ' disabled' : ''}`}
                disabled={disabled}
                key={item.key}
                type="button"
                onClick={() => handleNavigate(item.key)}
              >
                <Icon size={18} />
                {item.label}
              </button>
            )
          })}
        </nav>
      </aside>
    </main>
  )

  function renderReviewActions() {
    const nextDisabled = busy || reviewStep === 0 || (reviewStep === 1 && !isTableComplete) || (reviewStep === 2 && !isHandInfoComplete) || (reviewStep === 3 && !hasAiResults)
    const nextTitle =
      reviewStep === 0
        ? '请先选择创建或加载牌桌'
        : reviewStep === 1 && !isTableComplete
        ? getTableValidationMessage()
        : reviewStep === 2 && !isHandInfoComplete
          ? getHandInfoValidationMessage()
          : reviewStep === 3 && !hasAiResults
            ? '请先保存任一街道行动，并点击该街道的“分析”生成 AI 结果'
          : undefined
    const nextLabel = reviewStep === 0 ? '先选择牌桌入口' : reviewStep === 1 ? '保存牌桌并进入手牌信息' : reviewStep === 2 ? '保存手牌并进入行动信息' : reviewStep === 3 ? '去 AI 分析结果页' : '进入下一步'
    const nextAction = reviewStep === 1 ? saveTableAndContinue : reviewStep === 2 ? saveHand : () => goToReviewStep(Math.min(reviewStep + 1, 4) as ReviewStep)

    return (
      <footer className="review-action-bar">
        <div>
          <strong>{reviewSteps[reviewStep].label}</strong>
        </div>
        <div className="review-action-buttons">
          <button className="ghost-action" type="button" onClick={() => goToReviewStep(Math.max(reviewStep - 1, 0) as ReviewStep)} disabled={reviewStep === 0 || busy}>
            上一步
          </button>
          {reviewStep === 0 ? null : reviewStep < 4 ? (
            <button
              className="primary-action"
              type="button"
              onClick={nextAction}
              disabled={nextDisabled}
              title={nextTitle}
            >
              {busy ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
              {nextLabel}
            </button>
          ) : (
            <button className="primary-action" type="button" onClick={analyzeHand} disabled={busy || actions.length === 0}>
              {busy ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
              运行整手牌分析
            </button>
          )}
        </div>
      </footer>
    )
  }

  function renderAuth() {
    return (
      <section className="page-panel auth-grid">
        <form className="side-form" onSubmit={submitAuth}>
          <div className="section-heading">
            <div>
              <h2>{authMode === 'login' ? '用户登录' : '用户注册'}</h2>
              <p>登录后可管理个人资料和密码。</p>
            </div>
          </div>
          <label>
            <span>用户名</span>
            <input value={authForm.username} onChange={(event) => setAuthForm({ ...authForm, username: event.target.value })} />
          </label>
          {authMode === 'register' && (
            <label>
              <span>邮箱</span>
              <input value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} />
            </label>
          )}
          <label>
            <span>密码</span>
            <input type="password" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} />
          </label>
          <button className="primary-action full" type="submit" disabled={busy}>
            <KeyRound size={18} />
            {authMode === 'login' ? '登录' : '注册'}
          </button>
          <button className="ghost-action full" type="button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
            切换到{authMode === 'login' ? '注册' : '登录'}
          </button>
        </form>

        <section className="table-panel">
          <div className="section-heading">
            <div>
              <h2>用户信息管理</h2>
              <p>查看资料、修改密码或退出当前账号。</p>
            </div>
          </div>
          {profile ? (
            <div className="card-grid two">
              <article className="data-card">
                <strong>{profile.username}</strong>
                <span>{profile.email}</span>
                <p>登录有效期至：{profile.tokenExpiresAt.slice(0, 10)}</p>
              </article>
              <article className="data-card">
                <label>
                  <span>新密码</span>
                  <input type="password" value={authForm.newPassword} onChange={(event) => setAuthForm({ ...authForm, newPassword: event.target.value })} />
                </label>
                <div className="row-actions">
                  <button type="button" onClick={changePassword}>
                    修改密码
                  </button>
                  <button type="button" onClick={logout}>
                    <LogOut size={16} />
                    登出
                  </button>
                </div>
              </article>
            </div>
          ) : (
            <div className="empty-state">当前未登录，请先使用左侧表单登录或注册。</div>
          )}
        </section>
      </section>
    )
  }

  function renderReview() {
    return (
      <>
        <section className="review-layout" id="review">
          <section className="main-panel">
            {renderReviewStep()}
            {renderReviewActions()}
          </section>
          <aside className="step-panel" aria-label="复盘流程">
            <div className="section-heading">
              <div>
                <h2>手牌分析流程</h2>
              </div>
            </div>
            <div className="step-list">
              {reviewSteps.map((step, index) => (
                <button
                  className={`step-card ${index === reviewStep ? 'current' : index < reviewStep ? 'done' : 'next'}`}
                  key={step.label}
                  type="button"
                  onClick={() => goToReviewStep(index as ReviewStep)}
                  disabled={busy || (index > 1 && !isTableComplete) || (index > 2 && !isHandInfoComplete)}
                  title={
                    index > 1 && !isTableComplete
                      ? getTableValidationMessage()
                      : index > 2 && !isHandInfoComplete
                        ? getHandInfoValidationMessage()
                        : undefined
                  }
                >
                  {index < reviewStep ? <CheckCircle2 size={18} /> : index === reviewStep ? <Clock3 size={18} /> : <Circle size={18} />}
                  <div>
                    <strong>{step.label}</strong>
                  </div>
                </button>
              ))}
            </div>
            <div className="logic-note">
              <Bot size={18} />
              <div>
                <h3>分析状态</h3>
                <p>{currentHand.analysisDirty ? '基础信息、玩家或行动已变更，需要重新分析。' : '当前分析结果与手牌信息一致。'}</p>
              </div>
            </div>
          </aside>
        </section>
        <section className="flow-strip">
          <span>牌桌入口</span>
          <ChevronRight size={16} />
          <span>玩家信息</span>
          <ChevronRight size={16} />
          <span>手牌信息</span>
          <ChevronRight size={16} />
          <span>行动信息</span>
          <ChevronRight size={16} />
          <span>分街道分析</span>
          <ChevronRight size={16} />
          <span>历史沉淀</span>
        </section>
      </>
    )
  }

  function renderReviewStep() {
    if (reviewStep === 0) return renderTableEntry()
    if (reviewStep === 1) return renderPlayers()
    if (reviewStep === 2) return renderHandInfo()
    if (reviewStep === 3) return renderActions()
    return renderAnalysis()
  }

  function renderTableEntry() {
    return (
      <section className="table-entry-panel">
        <div className="section-heading">
          <div>
            <h2>选择牌桌入口</h2>
          </div>
        </div>
        <div className="table-entry-grid">
          <article className="entry-card primary-entry">
            <div>
              <span>新牌桌</span>
              <h3>创建新牌桌</h3>
              <p>从空白 6 人桌开始录入玩家、位置、类型和筹码。保存后下次可复用。</p>
            </div>
            <button className="primary-action full" type="button" onClick={createNewTableDraft} disabled={busy}>
              {busy ? <Loader2 className="spin" size={18} /> : <Plus size={18} />}
              创建新牌桌
            </button>
          </article>
          <article className="entry-card">
            <div>
              <span>已保存</span>
              <h3>加载已保存牌桌</h3>
              <p>选择常用牌桌模板，直接带入玩家列表和座位信息，再录入本手牌。</p>
            </div>
            <label>
              <span>选择牌桌模板</span>
              <select value={selectedTableTemplateId} onChange={(event) => setSelectedTableTemplateId(event.target.value)} disabled={busy || tableTemplates.length === 0}>
                {tableTemplates.length === 0 ? (
                  <option value="">暂无保存的牌桌</option>
                ) : tableTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} · {template.tableSize} 人 · {template.players.length} 位玩家
                  </option>
                ))}
              </select>
            </label>
            <button className="ghost-action full" type="button" onClick={() => loadSavedTable(selectedTableTemplateId || (tableTemplates[0]?.id ?? ''))} disabled={busy || tableTemplates.length === 0}>
              <Library size={18} />
              加载已保存牌桌
            </button>
          </article>
        </div>
      </section>
    )
  }

  function renderHandInfo() {
    return (
      <section className="hand-form-panel" aria-label="手牌信息录入表单">
          <div className="section-heading">
            <div>
            <h2>3. 手牌信息录入</h2>
          </div>
        </div>
        <form className="hand-form" onSubmit={(event) => event.preventDefault()}>
          <fieldset>
            <legend>基础信息</legend>
            <div className="form-grid">
              <label>
                <span>手牌名称 · 必填</span>
                <input
                  required
                  value={currentHand.handName}
                  placeholder="例如：FT AJs BTN open vs SB call"
                  onChange={(event) => updateHand('handName', event.target.value)}
                />
              </label>
            </div>
          </fieldset>
          <fieldset>
            <legend>游戏信息</legend>
            <div className="form-grid">
              <label>
                <span>游戏类型</span>
                <select value={currentHand.gameType} onChange={(event) => updateHand('gameType', event.target.value as GameType)}>
                  <option value="TOURNAMENT">锦标赛</option>
                  <option value="CASH">现金局</option>
                </select>
              </label>
              <label>
                <span>锦标赛阶段</span>
                <select value={currentHand.tournamentStage} onChange={(event) => updateHand('tournamentStage', event.target.value as TournamentStage)}>
                  {(['EARLY', 'BUBBLE', 'ITM', 'FT'] as TournamentStage[]).map((stage) => (
                    <option key={stage} value={stage}>
                      {tournamentStageLabels[stage]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>小盲</span>
                <input
                  required
                  min={0}
                  type="number"
                  value={currentHand.smallBlind}
                  placeholder="100"
                  onChange={(event) => updateHand('smallBlind', event.target.value === '' ? '' : Number(event.target.value))}
                />
              </label>
              <label>
                <span>大盲</span>
                <input
                  required
                  min={0}
                  type="number"
                  value={currentHand.bigBlind}
                  placeholder="200"
                  onChange={(event) => updateHand('bigBlind', event.target.value === '' ? '' : Number(event.target.value))}
                />
              </label>
              <label>
                <span>Ante · 选填</span>
                <input
                  min={0}
                  type="number"
                  value={currentHand.ante}
                  placeholder="200"
                  onChange={(event) => updateHand('ante', event.target.value === '' ? '' : Number(event.target.value))}
                />
              </label>
              <label>
                <span>有效筹码量 BB</span>
                <input type="number" value={currentHand.effectiveStack} onChange={(event) => updateHand('effectiveStack', Number(event.target.value))} />
              </label>
            </div>
          </fieldset>
          <fieldset>
            <legend>牌面信息</legend>
            <div className="card-entry-layout">
              <section className="card-entry-section hero-cards-entry">
                <h3>Hero 手牌</h3>
                <CardPickerGroup count={2} label="Hero 手牌" value={currentHand.heroCards} onChange={(value) => updateHand('heroCards', value)} />
              </section>
              <section className="card-entry-section board-cards-entry">
                <h3>公共牌</h3>
                <div className="board-card-grid">
                  <div className="card-street-entry flop-card-entry">
                    <span>翻牌面 · 必填</span>
                    <CardPickerGroup count={3} label="翻牌面" value={currentHand.boardFlop} onChange={(value) => updateHand('boardFlop', value)} />
                  </div>
                  <div className="card-street-entry turn-card-entry">
                    <span>转牌 · 选填</span>
                    <CardPickerGroup count={1} label="转牌" value={currentHand.boardTurn} onChange={(value) => updateHand('boardTurn', value)} allowEmpty optionalCollapsed />
                  </div>
                  <div className="card-street-entry river-card-entry">
                    <span>河牌 · 选填</span>
                    <CardPickerGroup count={1} label="河牌" value={currentHand.boardRiver} onChange={(value) => updateHand('boardRiver', value)} allowEmpty optionalCollapsed />
                  </div>
                </div>
              </section>
            </div>
          </fieldset>
        </form>
      </section>
    )
  }

  function renderPlayers() {
    const playerModalOpen = isAddingPlayer || Boolean(editingPlayerId)
    const editingPlayer = players.find((player) => player.id === editingPlayerId)

    return (
      <section className="player-workspace">
        <div className="table-panel">
          <div className="section-heading">
            <div>
              <h2>2. 牌桌与玩家信息</h2>
            </div>
          </div>
          <div className="table-template-panel">
            <label>
              <span>当前牌桌名称</span>
              <input value={tableTemplateName} onChange={(event) => setTableTemplateName(event.target.value)} placeholder="例如：周五常规局 6 人桌" />
            </label>
            {tableEntryMode === 'load' && (
              <label>
                <span>载入已保存牌桌</span>
                <select value={selectedTableTemplateId} onChange={(event) => applyTableTemplate(event.target.value)} disabled={busy}>
                  <option value="">{tableTemplates.length === 0 ? '暂无保存的牌桌' : '自定义当前牌桌'}</option>
                  {tableTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} · {template.tableSize} 人 · {template.players.length} 位玩家
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button className="ghost-action" type="button" onClick={saveCurrentTableTemplate} disabled={busy || !isTableComplete}>
              <Save size={16} />
              保存当前牌桌
            </button>
          </div>
          <div className="table-config-panel">
            <label>
              <span>桌人数</span>
              <select value={tableSize} onChange={(event) => changeTableSize(Number(event.target.value) as TableSize)}>
                {tableSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size} 人桌
                  </option>
                ))}
              </select>
            </label>
            <div>
              <strong>
                已录入 {players.length}/{tableSize} 人
              </strong>
              <span>{isTableComplete ? '当前牌桌信息完整；点击座位卡编辑玩家。' : getTableValidationMessage()}</span>
            </div>
          </div>
          <div className="position-strip" aria-label="当前桌型位置">
            {availablePositions.map((position) => {
              const seatedPlayer = players.find((player) => player.position === position)
              return (
                <article className={seatedPlayer ? `seat-card filled ${seatedPlayer.isHero ? 'hero' : ''}` : 'seat-card empty'} key={position}>
                  <div className="seat-card-header">
                    <div>
                      <strong>{positionLabels[position]}</strong>
                      <span>{seatedPlayer ? (seatedPlayer.isHero ? 'Hero / 当前主视角' : '对手玩家') : '空位'}</span>
                    </div>
                    {seatedPlayer && <span className={seatedPlayer.isHero ? 'player-badge hero-badge' : 'player-badge'}>{playerTypeLabels[seatedPlayer.playerType]}</span>}
                  </div>
                  {seatedPlayer ? (
                    <>
                      <div className="seat-player-main">
                        <strong>{seatedPlayer.name}</strong>
                        <span>{seatedPlayer.startingStack}BB</span>
                      </div>
                      <p>{seatedPlayer.rangeNotes || '暂无范围备注'}</p>
                      <div className="row-actions seat-card-actions">
                        <button type="button" onClick={() => editPlayer(seatedPlayer)} disabled={busy}>
                          <Pencil size={16} />
                          编辑
                        </button>
                        <button type="button" onClick={() => deletePlayer(seatedPlayer.id)} disabled={busy}>
                          <Trash2 size={16} />
                          删除
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p>还没有玩家坐在这个位置。</p>
                      <button className="ghost-action full" type="button" onClick={() => startAddPlayer(position)} disabled={busy || tableIsFull}>
                        <Plus size={16} />
                        添加玩家
                      </button>
                    </>
                  )}
                </article>
              )
            })}
          </div>
          {playerModalOpen && (
            <div className="modal-scrim" role="presentation" onMouseDown={cancelPlayerEditing}>
              <form className="player-modal" role="dialog" aria-modal="true" aria-labelledby="player-modal-title" onSubmit={addOrUpdatePlayer} onMouseDown={(event) => event.stopPropagation()}>
                <div className="modal-header">
                  <div>
                    <h2 id="player-modal-title">{editingPlayerId ? '编辑玩家' : '添加玩家'}</h2>
                    <p>{editingPlayer ? `${positionLabels[editingPlayer.position]} · ${editingPlayer.name}` : `${positionLabels[playerDraftPosition]} 空位`}</p>
                  </div>
                  <button className="icon-action" type="button" onClick={cancelPlayerEditing} aria-label="关闭玩家编辑弹窗">
                    <X size={18} />
                  </button>
                </div>
                {tableIsFull && !editingPlayerId && <div className="empty-state">当前 {tableSize} 人桌已满。请先删除玩家，或把桌人数调大。</div>}
                <div className="form-grid compact player-editor-main">
                  <label>
                    <span>玩家名称</span>
                    <input value={playerDraft.name} onChange={(event) => setPlayerDraft({ ...playerDraft, name: event.target.value })} autoFocus />
                  </label>
                  <label>
                    <span>位置</span>
                    <select value={playerDraftPosition} onChange={(event) => setPlayerDraft({ ...playerDraft, position: event.target.value as Position })}>
                      {availablePositions.map((item) => (
                        <option key={item} value={item}>
                          {positionLabels[item]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>玩家类型</span>
                    <select value={playerDraft.playerType} onChange={(event) => setPlayerDraft({ ...playerDraft, playerType: event.target.value as PlayerType })}>
                      {Object.entries(playerTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>起始筹码 BB</span>
                    <input type="number" value={playerDraft.startingStack} onChange={(event) => setPlayerDraft({ ...playerDraft, startingStack: Number(event.target.value) })} />
                  </label>
                </div>
                <label>
                  <span>范围备注</span>
                  <textarea value={playerDraft.rangeNotes} onChange={(event) => setPlayerDraft({ ...playerDraft, rangeNotes: event.target.value })} />
                </label>
                <div className="modal-footer">
                  <label className="checkbox-field">
                    <input type="checkbox" checked={playerDraft.isHero} onChange={(event) => setPlayerDraft({ ...playerDraft, isHero: event.target.checked })} />
                    <span>设为 Hero</span>
                  </label>
                  <div className="row-actions player-editor-actions">
                    <button type="button" onClick={cancelPlayerEditing}>
                      取消
                    </button>
                    <button className="primary-action" type="submit" disabled={busy || (tableIsFull && !editingPlayerId)}>
                      {busy ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
                      {editingPlayerId ? '保存玩家' : '添加玩家'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
                )}
        </div>
      </section>
    )
  }

  function renderActions() {
    const viewingPlayer = players.find((player) => player.id === viewingPlayerId)
    const sortedActions = [...actions].sort((first, second) => first.actionOrder - second.actionOrder)
    const streetCardValues: Record<Street, string> = {
      PREFLOP: '',
      FLOP: currentHand.boardFlop,
      TURN: currentHand.boardTurn,
      RIVER: currentHand.boardRiver,
    }
    const boardKeys: Record<DealtStreet, 'boardFlop' | 'boardTurn' | 'boardRiver'> = {
      FLOP: 'boardFlop',
      TURN: 'boardTurn',
      RIVER: 'boardRiver',
    }
    const boardCardCounts: Record<DealtStreet, number> = {
      FLOP: 3,
      TURN: 1,
      RIVER: 1,
    }

    const saveBoardCard = async (street: DealtStreet, value: string) => {
      updateHand(boardKeys[street], value)
      if (!hasCompleteCards(value, boardCardCounts[street])) return
      setBusy(true)
      const saved = await apiClient.updateHand({ ...currentHand, [boardKeys[street]]: value, analysisDirty: true })
      setHand(saved)
      setEditingBoardStreet(null)
      showNotice(`${streetLabels[street]}已发出，可以继续录入行动`)
      setBusy(false)
    }

    const renderStreetBoardEditor = (street: DealtStreet, forceOpen = false) => {
      const value = streetCardValues[street]
      const isComplete = hasCompleteCards(value, boardCardCounts[street])
      const isEditing = forceOpen || editingBoardStreet === street || !isComplete
      return (
        isEditing && (
          <div className={isComplete ? 'street-board-card ready editing' : 'street-board-card editing'}>
            <CardPickerGroup count={boardCardCounts[street]} label={streetLabels[street]} value={value} onChange={(nextValue) => saveBoardCard(street, nextValue)} allowEmpty />
          </div>
        )
      )
    }

    const renderStreetBoardDisplay = (street: Street, value: string) => {
      if (street === 'PREFLOP' || !value) return null
      const dealtStreet = street as DealtStreet
      if (!hasCompleteCards(value, boardCardCounts[dealtStreet])) return null
      return (
        <div className="street-dealt-row">
          <button
            className="street-dealt-cards"
            type="button"
            aria-label={`${editingBoardStreet === dealtStreet ? '关闭' : '编辑'}${streetLabels[street]}牌面`}
            onClick={() => setEditingBoardStreet((current) => (current === dealtStreet ? null : dealtStreet))}
          >
            <CardDisplay value={value} />
          </button>
        </div>
      )
    }

    const renderStreetAnalysisButton = (street: Street, streetActions: HandAction[], boardBlocked: boolean) => (
      <button className="primary-action street-analysis-button" type="button" onClick={() => analyzeStreet(street)} disabled={busy || boardBlocked || streetActions.length === 0}>
        {busy ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
        分析{streetLabels[street]}
      </button>
    )

    const renderPlayerActionCard = (street: Street, player: HandPlayer, existingAction?: HandAction) => {
      const key = actionDraftKey(street, player.id)
      const persistedDraft = existingAction
        ? {
            playerId: existingAction.playerId,
            street: existingAction.street,
            actionType: existingAction.actionType,
            actionSize: existingAction.actionSize,
            sizeUnit: existingAction.sizeUnit,
          }
        : undefined
      const draft = actionDrafts[key] ?? persistedDraft ?? createActionDraft(street, player.id)
      const needsSize = !nonSizingActionTypes.has(draft.actionType)
      const isSelected = existingAction && selectedActionId === existingAction.id
      const isEditing = existingAction && editingActionId === existingAction.id
      const heroCards = player.holeCards || currentHand.heroCards
      return (
        <article className={`player-action-card${isSelected ? ' selected' : ''}${isEditing ? ' editing' : ''}`} key={player.id}>
          <div className="player-action-header">
            <span className="action-position-badge">{positionLabels[player.position]}</span>
            <button className="player-action-main" type="button" onClick={() => existingAction && setSelectedActionId(existingAction.id)} disabled={!existingAction}>
              <strong>{player.name}</strong>
              <span>{player.isHero ? 'Hero' : playerTypeLabels[player.playerType]} · {player.startingStack}BB</span>
            </button>
            {player.isHero && (
              <span className="hero-hole-cards" aria-label="Hero 手牌">
                <CardDisplay value={heroCards} />
              </span>
            )}
            <button className="icon-action compact" type="button" onClick={() => setViewingPlayerId(player.id)} aria-label={`查看${player.name}玩家信息`}>
              <UserCircle size={17} />
            </button>
          </div>
          <div className="action-editor-grid">
            <label>
              <span>行动</span>
              <select
                value={draft.actionType}
                onChange={(event) => updateActionDraft(street, player.id, { actionType: event.target.value as ActionType }, persistedDraft)}
              >
                {actionTypeOptionsByStreet[street].map((item) => (
                  <option key={item} value={item}>
                    {actionTypeLabels[item]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>大小</span>
              <input
                disabled={!needsSize}
                min={0}
                step="0.1"
                type="number"
                value={needsSize ? draft.actionSize : 0}
                onChange={(event) => updateActionDraft(street, player.id, { actionSize: Number(event.target.value) }, persistedDraft)}
              />
            </label>
            <label>
              <span>单位</span>
              <select
                disabled={!needsSize}
                value={draft.sizeUnit}
                onChange={(event) => updateActionDraft(street, player.id, { sizeUnit: event.target.value as SizeUnit }, persistedDraft)}
              >
                <option value="BB">BB</option>
                <option value="ABSOLUTE">筹码量</option>
                <option value="PERCENT">底池比例</option>
              </select>
            </label>
          </div>
          <div className="row-actions player-action-actions">
            <button className="primary-action" type="button" onClick={() => savePlayerAction(street, player)} disabled={busy || Boolean(existingAction)}>
              {existingAction ? <CheckCircle2 size={16} /> : <Plus size={16} />}
              {existingAction ? '已完成' : '保存'}
            </button>
            <button className="primary-action" type="button" onClick={() => savePlayerAction(street, player, existingAction)} disabled={busy || !existingAction}>
              <Save size={16} />
              {isEditing ? '保存' : '更新'}
            </button>
            <button type="button" disabled>
              <Sparkles size={16} />
              分析
            </button>
          </div>
        </article>
      )
    }

    return (
      <section className="action-workspace">
        <div className="table-panel">
          <div className="section-heading">
            <div>
              <h2>4. 行动信息</h2>
            </div>
          </div>
          <div className="street-action-list">
            {streetOrder.map((street) => {
              const streetActions = sortedActions.filter((action) => action.street === street)
              const streetPlayers = getPlayersForStreet(street, visiblePlayers, sortedActions, availablePositions)
              const boardBlocked = (street === 'TURN' && !hasCompleteCards(currentHand.boardTurn, 1)) || (street === 'RIVER' && !hasCompleteCards(currentHand.boardRiver, 1))
              const streetCards = streetCardValues[street]
              return (
                <article className={boardBlocked ? 'street-action-group gated' : 'street-action-group'} key={street}>
                  <div className="street-action-header">
                    <div className="street-action-title">
                      <strong>{streetLabels[street]}</strong>
                    </div>
                    <div className="street-action-tools">
                      {renderStreetAnalysisButton(street, streetActions, boardBlocked)}
                    </div>
                  </div>
                  {renderStreetBoardDisplay(street, streetCards)}
                  {street === 'FLOP' ? renderStreetBoardEditor(street) : null}
                  {street === 'TURN' || street === 'RIVER' ? renderStreetBoardEditor(street, !streetCards) : null}
                  {boardBlocked ? (
                    <div className="empty-street">{streetLabels[street]}牌面完整后，该街行动会出现在这里。</div>
                  ) : streetPlayers.length === 0 ? (
                    <div className="empty-street">没有可进入{streetLabels[street]}的玩家。</div>
                  ) : (
                    <div className="player-action-grid">
                      {streetPlayers.map((player) => renderPlayerActionCard(street, player, streetActions.find((action) => action.playerId === player.id)))}
                    </div>
                  )}
                  <div className="street-action-footer">
                    {renderStreetAnalysisButton(street, streetActions, boardBlocked)}
                  </div>
                </article>
              )
            })}
          </div>
        </div>
        {viewingPlayer && (
          <div className="modal-scrim" role="presentation" onMouseDown={() => setViewingPlayerId(null)}>
            <article className="player-modal player-info-modal" role="dialog" aria-modal="true" aria-labelledby="player-info-title" onMouseDown={(event) => event.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2 id="player-info-title">{viewingPlayer.name}</h2>
                  <p>
                    {positionLabels[viewingPlayer.position]} · {viewingPlayer.isHero ? 'Hero' : playerTypeLabels[viewingPlayer.playerType]}
                  </p>
                </div>
                <button className="icon-action" type="button" onClick={() => setViewingPlayerId(null)} aria-label="关闭玩家信息弹窗">
                  <X size={18} />
                </button>
              </div>
              <div className="player-info-grid">
                <div>
                  <span>起始筹码</span>
                  <strong>{viewingPlayer.startingStack}BB</strong>
                </div>
                <div>
                  <span>玩家类型</span>
                  <strong>{playerTypeLabels[viewingPlayer.playerType]}</strong>
                </div>
                <div>
                  <span>底牌</span>
                  <strong><CardDisplay value={viewingPlayer.holeCards || (viewingPlayer.isHero ? currentHand.heroCards : '')} /></strong>
                </div>
              </div>
              <div className="logic-note player-info-note">
                <UserCircle size={18} />
                <div>
                  <h3>范围备注</h3>
                  <p>{viewingPlayer.rangeNotes || '暂无范围备注'}</p>
                </div>
              </div>
            </article>
          </div>
        )}
      </section>
    )
  }

  function renderAnalysis() {
    return (
      <section className="analysis-layout">
        <div className="table-panel">
          <div className="section-heading">
            <div>
              <h2>5. AI 行动分析结果</h2>
            </div>
            <button className="ghost-action" type="button" onClick={analyzeHand} disabled={busy || actions.length === 0}>
              <Sparkles size={16} />
              重新分析整手牌
            </button>
          </div>
          <div className="action-summary-grid">
            {actions.map((action) => {
              const player = players.find((item) => item.id === action.playerId)
              return (
                <button className={selectedActionId === action.id ? 'summary-action selected' : 'summary-action'} key={action.id} type="button" onClick={() => setSelectedActionId(action.id)}>
                  <strong>
                    #{action.actionOrder} {streetLabels[action.street]} · {player?.name ?? '未知玩家'} {actionTypeLabels[action.actionType]}
                  </strong>
                  <span>{action.analysis?.oneLineConclusion ?? '尚未分析'}</span>
                </button>
              )
            })}
          </div>
        </div>
        <aside className="analysis-panel">
          <div className="section-heading">
            <div>
              <h2>AI 分析面板</h2>
              <p>{selectedAction ? `${streetLabels[selectedAction.street]} · ${actionTypeLabels[selectedAction.actionType]}` : '请选择行动'}</p>
            </div>
          </div>
          {selectedAction?.analysis ? (
            <>
              <div className="score-card">
                <div>
                  <span>GTO 评分</span>
                  <strong>{selectedAction.analysis.gtoScore}</strong>
                </div>
                <div>
                  <span>EV 值</span>
                  <strong>{selectedAction.analysis.evValue}</strong>
                </div>
              </div>
              <AnalysisBlock title="一句话结论" text={selectedAction.analysis.oneLineConclusion} highlight />
              <AnalysisBlock title="Range 分析" text={selectedAction.analysis.rangeAnalysis} />
              <AnalysisBlock title="EV / 最优行动" text={`建议行动：${actionTypeLabels[selectedAction.analysis.optimalAction]}。${selectedAction.analysis.suggestion}`} />
              <AnalysisBlock title="下注尺度" text={selectedAction.analysis.betSizingReview} />
              <AnalysisBlock title="Exploit 调整" text={selectedAction.analysis.exploitAdjustment} />
              <AnalysisBlock title="ICM 影响" text={selectedAction.analysis.icmImpact} />
            </>
          ) : (
            <div className="empty-state">
              <Bot size={22} />
              <p>该行动还没有分析结果。回到行动信息，点击对应街道的“分析”生成结果。</p>
              <button className="primary-action" type="button" onClick={() => goToReviewStep(3)} disabled={busy}>
                回到行动信息
              </button>
            </div>
          )}
          {currentHand.overallSuggestion && (
            <div className="logic-note">
              <CheckCircle2 size={18} />
              <div>
                <h3>整手牌总结 · {currentHand.overallGtoScore}</h3>
                <p>{currentHand.overallSuggestion}</p>
              </div>
            </div>
          )}
        </aside>
      </section>
    )
  }

  function renderLibrary() {
    return (
      <section className="page-panel">
        <div className="section-heading">
          <div>
            <h2>2.3 历史记录管理</h2>
            <p>支持按时间、游戏类型、阶段、对手类型、GTO 分数和关键词筛选。</p>
          </div>
        </div>
        <div className="filter-bar expanded">
          <label>
            <span>搜索</span>
            <div className="input-with-icon">
              <Search size={16} />
              <input value={handFilters.search ?? ''} onChange={(event) => setHandFilters({ ...handFilters, search: event.target.value })} placeholder="手牌、公共牌、Hero 手牌" />
            </div>
          </label>
          <label>
            <span>游戏类型</span>
            <select value={handFilters.gameType ?? 'ALL'} onChange={(event) => setHandFilters({ ...handFilters, gameType: event.target.value as 'ALL' | GameType })}>
              <option value="ALL">全部</option>
              <option value="TOURNAMENT">锦标赛</option>
              <option value="CASH">现金局</option>
            </select>
          </label>
          <label>
            <span>锦标赛阶段</span>
            <select value={handFilters.stage ?? 'ALL'} onChange={(event) => setHandFilters({ ...handFilters, stage: event.target.value as 'ALL' | TournamentStage })}>
              <option value="ALL">全部</option>
              {(['EARLY', 'BUBBLE', 'ITM', 'FT'] as TournamentStage[]).map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>对手类型</span>
            <select value={handFilters.opponentType ?? 'ALL'} onChange={(event) => setHandFilters({ ...handFilters, opponentType: event.target.value as 'ALL' | PlayerType })}>
              <option value="ALL">全部</option>
              {Object.entries(playerTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>开始日期</span>
            <input type="date" value={handFilters.dateFrom ?? ''} onChange={(event) => setHandFilters({ ...handFilters, dateFrom: event.target.value })} />
          </label>
          <label>
            <span>结束日期</span>
            <input type="date" value={handFilters.dateTo ?? ''} onChange={(event) => setHandFilters({ ...handFilters, dateTo: event.target.value })} />
          </label>
          <label>
            <span>GTO 评分低于</span>
            <input type="number" value={handFilters.maxScore ?? ''} onChange={(event) => setHandFilters({ ...handFilters, maxScore: event.target.value ? Number(event.target.value) : undefined })} />
          </label>
          <button className="primary-action" type="button" onClick={refreshHandList}>
            查询
          </button>
          <button className="ghost-action" type="button" onClick={resetHandFilters}>
            重置
          </button>
        </div>
        <div className="card-grid">
          {handList.length === 0 ? (
            <div className="empty-state">没有符合筛选条件的手牌。可以重置筛选，或先在复盘工作台保存一手牌。</div>
          ) : handList.map((item) => (
            <article className="data-card" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <span>
                  {gameTypeLabels[item.gameType]} · {tournamentStageLabels[item.stage]} · {item.createdAt.slice(0, 10)}
                </span>
              </div>
              <div className="card-summary">
                <CardDisplay value={item.heroCards} prefix="Hero" />
                <CardDisplay value={item.board} prefix="Board" />
              </div>
              <div className="metric-row">
                <span>GTO {item.score}</span>
                <span>{playerTypeLabels[item.opponentType]}</span>
                <span>{item.analysisDirty ? '需重新分析' : '分析有效'}</span>
              </div>
              <div className="row-actions">
                <button type="button" onClick={() => inspectHand(item.id, 'view')}>
                  查看详情
                </button>
                <button type="button" onClick={() => inspectHand(item.id, 'edit')}>
                  编辑并重新分析
                </button>
                <button type="button" onClick={() => deleteHand(item.id)}>
                  删除
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    )
  }

  function renderOpponents() {
    return (
      <section className="page-panel">
        <div className="section-heading">
          <div>
            <h2>对手分析</h2>
            <p>覆盖对手列表、详情、风格分析、行动模式、交手记录。</p>
          </div>
        </div>
        <div className="split-panel padded">
          <div className="card-grid single">
            {opponents.map((opponent) => (
              <article className={selectedOpponentId === opponent.id ? 'data-card hero' : 'data-card'} key={opponent.id}>
                <div>
                  <strong>{opponent.name}</strong>
                  <span>
                    手动 {playerTypeLabels[opponent.manualType]} · 推断 {playerTypeLabels[opponent.inferredType]}
                  </span>
                </div>
                <div className="metric-grid">
                  <span>样本 {opponent.analyzedHandsCount}</span>
                  <span>Open {opponent.preflopStats.openFreq}%</span>
                  <span>3-bet {opponent.preflopStats.threeBetFreq}%</span>
                  <span>C-bet {opponent.postflopStats.flopCbetFreq}%</span>
                  <span>Bluff {opponent.styleMetrics.bluffProbability}%</span>
                  <span>AF {opponent.styleMetrics.aggressionFactor}</span>
                </div>
                <div className="row-actions">
                  <button type="button" onClick={() => setSelectedOpponentId(opponent.id)}>
                    查看详情
                  </button>
                  <button type="button" onClick={() => analyzeOpponent(opponent.id)} disabled={busy}>
                    分析 {opponent.name}
                  </button>
                  <button type="button" onClick={() => createStrategyFromOpponent(opponent.id)}>
                    生成 {opponent.name} 策略
                  </button>
                </div>
              </article>
            ))}
          </div>
          {selectedOpponent && (
            <aside className="analysis-panel compact-panel">
              <div className="section-heading">
                <div>
                  <h2>{selectedOpponent.name} 详情</h2>
                  <p>风格、范围与交手记录。</p>
                </div>
              </div>
              <AnalysisBlock title="翻前范围" text={selectedOpponent.inferredRanges.preflop} />
              <AnalysisBlock title="翻后范围" text={selectedOpponent.inferredRanges.postflop} />
              <h3>行动模式</h3>
              <div className="mini-list">
                {selectedOpponent.patterns.map((pattern) => (
                  <div key={pattern.id}>
                    <strong>{patternTypeLabels[pattern.patternType]}</strong>
                    <span>
                      {pattern.position === 'ANY' ? '任意位置' : positionLabels[pattern.position]} · {boardTextureLabels[pattern.boardTexture] ?? pattern.boardTexture} · 频率 {pattern.frequency}% · 样本 {pattern.sampleSize}
                    </span>
                  </div>
                ))}
              </div>
              <h3>交手记录</h3>
              <div className="mini-list">
                {opponentHands.map((item) => (
                  <button key={item.id} type="button" onClick={() => inspectHand(item.id, 'view')}>
                    {item.title} · GTO {item.score}
                  </button>
                ))}
              </div>
            </aside>
          )}
        </div>
      </section>
    )
  }

  function renderStrategies() {
    return (
      <section className="page-panel">
        <div className="section-heading">
          <div>
            <h2>策略调整与收益评估</h2>
            <p>管理策略启用状态、收益评估和复盘记录。</p>
          </div>
          <button className="ghost-action" type="button" onClick={refreshStrategies} disabled={busy}>
            刷新策略
          </button>
        </div>
        <section className="split-panel padded">
          <div>
            <div className="card-grid single">
              {strategies.length === 0 ? (
                <div className="empty-state">暂无策略。可从对手画像生成一条，或使用右侧表单手动创建。</div>
              ) : strategies.map((strategy) => (
                <article className="data-card" key={strategy.id}>
                  <div>
                    <strong>
                      {strategy.playerName} · {adjustmentTypeLabels[strategy.adjustmentType]} {adjustmentScopeLabels[strategy.adjustmentScope]}
                    </strong>
                    <span>{strategy.isActive ? '已启用' : '已停用'}</span>
                  </div>
                  <p>{strategy.adjustedStrategy}</p>
                  <p>{strategy.reason}</p>
                  <div className="metric-row">
                    <span>预期 EV +{strategy.expectedEvImprovement} BB/100</span>
                    <span>置信度 {strategy.confidenceLevel}%</span>
                    <span>最后使用 {strategy.lastUsedAt?.slice(0, 10) ?? '-'}</span>
                  </div>
                  <div className="row-actions">
                    <button type="button" onClick={() => editStrategy(strategy)}>
                      编辑
                    </button>
                    <button type="button" onClick={() => toggleStrategy(strategy.id)}>
                      {strategy.isActive ? '停用' : '启用'}
                    </button>
                    <button type="button" onClick={() => deleteStrategy(strategy.id)}>
                      删除
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <h3 className="subheading">评估记录</h3>
            <div className="mini-list">
              {evaluations.length === 0 ? (
                <div>暂无策略评估记录。</div>
              ) : evaluations.map((evaluation) => (
                <div key={evaluation.id}>
                  <strong>
                    {strategyOutcomeLabels[evaluation.outcome]} · EV {evaluation.evDifference >= 0 ? '+' : ''}
                    {evaluation.evDifference}
                  </strong>
                  <span>
                    评分 {evaluation.effectivenessRating}/5 · {evaluation.notes}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <form className="side-form" onSubmit={createOrUpdateStrategy}>
            <h2>{editingStrategyId ? '编辑策略' : '创建策略'}</h2>
            <label>
              <span>目标对手</span>
              <select value={strategyDraft.playerId} onChange={(event) => setStrategyDraft({ ...strategyDraft, playerId: event.target.value })}>
                {opponents.map((opponent) => (
                  <option key={opponent.id} value={opponent.id}>
                    {opponent.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-grid compact">
              <label>
                <span>调整街道</span>
                <select value={strategyDraft.adjustmentType} onChange={(event) => setStrategyDraft({ ...strategyDraft, adjustmentType: event.target.value as AdjustmentType })}>
                  {(['PREFLOP', 'FLOP', 'TURN', 'RIVER', 'GENERAL'] as AdjustmentType[]).map((item) => (
                    <option key={item} value={item}>
                      {adjustmentTypeLabels[item]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>调整范围</span>
                <select value={strategyDraft.adjustmentScope} onChange={(event) => setStrategyDraft({ ...strategyDraft, adjustmentScope: event.target.value as AdjustmentScope })}>
                  {(['OPEN', '3BET', 'CALL', 'BET', 'RAISE', 'CHECK', 'FOLD'] as AdjustmentScope[]).map((item) => (
                    <option key={item} value={item}>
                      {adjustmentScopeLabels[item]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              <span>原始 GTO 策略</span>
              <textarea value={strategyDraft.originalStrategy} onChange={(event) => setStrategyDraft({ ...strategyDraft, originalStrategy: event.target.value })} />
            </label>
            <label>
              <span>调整后策略</span>
              <textarea value={strategyDraft.adjustedStrategy} onChange={(event) => setStrategyDraft({ ...strategyDraft, adjustedStrategy: event.target.value })} />
            </label>
            <label>
              <span>调整理由</span>
              <textarea value={strategyDraft.reason} onChange={(event) => setStrategyDraft({ ...strategyDraft, reason: event.target.value })} />
            </label>
            <div className="form-grid compact">
              <label>
                <span>预期 EV 提升</span>
                <input type="number" value={strategyDraft.expectedEvImprovement} onChange={(event) => setStrategyDraft({ ...strategyDraft, expectedEvImprovement: Number(event.target.value) })} />
              </label>
              <label>
                <span>置信度</span>
                <input type="number" value={strategyDraft.confidenceLevel} onChange={(event) => setStrategyDraft({ ...strategyDraft, confidenceLevel: Number(event.target.value) })} />
              </label>
            </div>
            <button className="primary-action full" type="submit">
              {editingStrategyId ? '更新策略' : '创建策略'}
            </button>
            {selectedStrategy && (
              <div className="evaluation-box">
                <h3>创建策略评估</h3>
                <label>
                  <span>评估策略</span>
                  <select value={selectedStrategy.id} onChange={(event) => setEvaluationStrategyId(event.target.value)}>
                    {strategies.map((strategy) => (
                      <option key={strategy.id} value={strategy.id}>
                        {strategy.playerName} · {adjustmentTypeLabels[strategy.adjustmentType]} {adjustmentScopeLabels[strategy.adjustmentScope]}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="form-grid compact">
                  <label>
                    <span>实际 EV</span>
                    <input type="number" value={evaluationDraft.actualEv} onChange={(event) => setEvaluationDraft({ ...evaluationDraft, actualEv: Number(event.target.value) })} />
                  </label>
                  <label>
                    <span>预期 EV</span>
                    <input type="number" value={evaluationDraft.expectedEv} onChange={(event) => setEvaluationDraft({ ...evaluationDraft, expectedEv: Number(event.target.value) })} />
                  </label>
                </div>
                <label>
                  <span>结果</span>
                  <select value={evaluationDraft.outcome} onChange={(event) => setEvaluationDraft({ ...evaluationDraft, outcome: event.target.value as StrategyOutcome })}>
                    <option value="WIN">盈利</option>
                    <option value="LOSS">亏损</option>
                    <option value="DRAW">持平</option>
                  </select>
                </label>
                <label>
                  <span>效果评分</span>
                  <input type="number" min={1} max={5} value={evaluationDraft.effectivenessRating} onChange={(event) => setEvaluationDraft({ ...evaluationDraft, effectivenessRating: Number(event.target.value) })} />
                </label>
                <label>
                  <span>备注</span>
                  <textarea value={evaluationDraft.notes} onChange={(event) => setEvaluationDraft({ ...evaluationDraft, notes: event.target.value })} />
                </label>
                <button className="ghost-action full" type="button" onClick={createEvaluation}>
                  创建评估
                </button>
              </div>
            )}
          </form>
        </section>
      </section>
    )
  }

  function renderStats() {
    const resultCount = analyzedActions.length + (currentHand.overallSuggestion ? 1 : 0)
    return (
      <section className="page-panel ai-results-page">
        <div className="section-heading">
          <div>
            <h2>AI 结果保存页</h2>
            <p>{resultCount === 0 ? '当前手牌还没有已保存的 AI 分析结果。' : `当前手牌已保存 ${resultCount} 条 AI 分析结果。`}</p>
          </div>
          <button className="ghost-action" type="button" onClick={() => navigateToRoute({ section: 'review', reviewStep: 3 })}>
            回到行动信息
          </button>
        </div>
        {resultCount === 0 ? (
          <div className="empty-state">
            <Bot size={22} />
            <p>在“行动信息”里保存玩家行动后，点击对应街道的“分析”，结果会出现在这里。</p>
          </div>
        ) : (
          <div className="ai-result-grid">
            {currentHand.overallSuggestion && (
              <button
                className="ai-result-card"
                type="button"
                onClick={() => {
                  setSelectedActionId(actions[0]?.id ?? '')
                  navigateToRoute({ section: 'review', reviewStep: 4 })
                }}
              >
                <div>
                  <span>整手牌总结</span>
                  <strong>{currentHand.overallSuggestion}</strong>
                </div>
                <div className="ai-result-metrics">
                  <span>GTO {currentHand.overallGtoScore ?? '-'}</span>
                  <span>全局建议</span>
                </div>
              </button>
            )}
            {analyzedActions.map((action) => {
              const player = players.find((item) => item.id === action.playerId)
              return (
                <button
                  className="ai-result-card"
                  key={action.id}
                  type="button"
                  onClick={() => {
                    setSelectedActionId(action.id)
                    navigateToRoute({ section: 'review', reviewStep: 4 })
                  }}
                >
                  <div>
                    <span>
                      {streetLabels[action.street]} · {player?.position ?? '-'} · {player?.name ?? '未知玩家'}
                    </span>
                    <strong>{action.analysis?.oneLineConclusion}</strong>
                  </div>
                  <div className="ai-result-metrics">
                    <span>GTO {action.analysis?.gtoScore}</span>
                    <span>EV {action.analysis?.evValue}</span>
                    <span>{actionTypeLabels[action.actionType]}</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>
    )
  }

}

function AnalysisBlock({ title, text, highlight = false }: { title: string; text: string; highlight?: boolean }) {
  return (
    <div className={highlight ? 'analysis-block highlight' : 'analysis-block'}>
      <CheckCircle2 size={18} />
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  )
}

function CardPickerGroup({
  value,
  count,
  label,
  onChange,
  allowEmpty = false,
  optionalCollapsed = false,
}: {
  value: string
  count: number
  label: string
  onChange: (value: string) => void
  allowEmpty?: boolean
  optionalCollapsed?: boolean
}) {
  const cards = splitCards(value)
  const shouldCollapse = optionalCollapsed && allowEmpty && cards.length === 0
  const updateCard = (index: number, field: 'suit' | 'rank', nextValue: string) => {
    const current = readCard(cards[index] ?? '')
    const next = {
      ...current,
      [field]: nextValue,
    }
    const nextCard = next.suit && next.rank ? `${next.suit}${next.rank}` : next.suit ? next.suit : next.rank ? `·${next.rank}` : ''
    onChange(replaceCardAt(value, index, nextCard))
  }

  if (shouldCollapse) {
    return (
      <button
        className="optional-card-add"
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onChange('·')
        }}
      >
        添加{label}
      </button>
    )
  }

  return (
    <div className="card-picker-group">
      {Array.from({ length: count }, (_, index) => {
        const card = readCard(cards[index] ?? '')
        const preview = card.suit && card.rank ? (`${card.suit}${card.rank}` as CardValue) : ''
        return (
          <div className="card-picker" key={index}>
            <span className={preview ? 'card-picker-preview selected' : 'card-picker-preview'}>
              {preview ? <CardDisplay value={preview} /> : <span className="card-picker-empty">未选</span>}
            </span>
            {allowEmpty && (
              <button className="clear-card-button" type="button" aria-label={`清除${label}`} onClick={() => onChange(replaceCardAt(value, index, ''))} disabled={!cards[index]}>
                <X size={12} />
              </button>
            )}
            <div className="suit-button-row" role="radiogroup" aria-label={`${label}第 ${index + 1} 张牌花色`}>
              {suitOptions.map((suit) => (
                <button
                  aria-label={`${label}第 ${index + 1} 张牌${suit}`}
                  aria-pressed={card.suit === suit}
                  className={card.suit === suit ? `suit-button selected ${suit}` : `suit-button ${suit}`}
                  key={suit}
                  title={suit}
                  type="button"
                  onClick={() => updateCard(index, 'suit', card.suit === suit && allowEmpty ? '' : suit)}
                >
                  <img alt="" src={suitImages[suit]} />
                </button>
              ))}
            </div>
            <div className="rank-button-grid" role="radiogroup" aria-label={`${label}第 ${index + 1} 张牌点数`}>
              {rankOptions.map((rank) => (
                <button
                  aria-label={`${label}第 ${index + 1} 张牌${rank}`}
                  aria-pressed={card.rank === rank}
                  className={card.rank === rank ? 'rank-button selected' : 'rank-button'}
                  key={rank}
                  type="button"
                  onClick={() => updateCard(index, 'rank', card.rank === rank && allowEmpty ? '' : rank)}
                >
                  {rank}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CardDisplay({ value, prefix }: { value: string; prefix?: string }) {
  const cards = splitCards(value).filter((item) => item !== '·' && item !== '-')
  if (cards.length === 0) return <span>{prefix ? `${prefix} -` : '-'}</span>

  return (
    <span className="card-display">
      {prefix && <span className="card-prefix">{prefix}</span>}
      {cards.map((card, index) => {
        const parsed = readCard(card)
        if (!parsed.suit || !parsed.rank) {
          return (
            <span className="card-token text" key={`${card}-${index}`}>
              {card}
            </span>
          )
        }
        return (
          <span className={`card-token ${parsed.suit}`} key={`${card}-${index}`} title={card}>
            <img alt={parsed.suit} src={suitImages[parsed.suit]} />
            <strong>{parsed.rank}</strong>
          </span>
        )
      })}
    </span>
  )
}

export default App
