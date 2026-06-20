import type {
  ActionDraft,
  ActionType,
  AdjustmentScope,
  AdjustmentType,
  GameType,
  HandAction,
  HandInfo,
  HandPlayer,
  PlayerDraft,
  PlayerType,
  Position,
  SectionKey,
  SizeUnit,
  StrategyDraft,
  StrategyOutcome,
  Street,
  TournamentStage,
} from '../mockApi'

export type ReviewStep = 0 | 1 | 2 | 3 | 4
export type NoticeType = 'success' | 'info' | 'error'
export type Notice = { text: string; type: NoticeType } | null
export type TableSize = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type CardSuit = '黑桃' | '红桃' | '方块' | '梅花'
export type CardRank = 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2'
export type CardValue = `${CardSuit}${CardRank}` | ''
export type RouteState = { section: SectionKey; reviewStep: ReviewStep }
export type DealtStreet = Extract<Street, 'FLOP' | 'TURN' | 'RIVER'>
export type SelectOption<Value extends string | number> = { value: Value; label: string; disabled?: boolean }

export const disabledNavSections = new Set<SectionKey>(['auth', 'opponents', 'strategies', 'bankroll'])

export const reviewSteps = [
  { label: '1. 牌桌入口' },
  { label: '2. 牌桌与玩家信息' },
  { label: '3. 手牌信息录入' },
  { label: '4. 行动信息' },
  { label: '5. AI 分析结果' },
]

export const sectionPaths: Record<SectionKey, string> = {
  auth: '/auth',
  review: '/review/table',
  library: '/library',
  opponents: '/opponents',
  strategies: '/strategies',
  bankroll: '/bankroll',
  stats: '/stats',
}

export const reviewStepSlugs: Record<ReviewStep, string> = {
  0: 'table',
  1: 'players',
  2: 'hand',
  3: 'actions',
  4: 'analysis',
}

export const reviewStepBySlug: Record<string, ReviewStep> = {
  table: 0,
  players: 1,
  hand: 2,
  actions: 3,
  analysis: 4,
}

export const pathForRoute = ({ section, reviewStep }: RouteState) =>
  section === 'review' ? `/review/${reviewStepSlugs[reviewStep]}` : sectionPaths[section]

export const parseRoute = (pathname: string): RouteState => {
  const [sectionSlug, reviewSlug] = pathname.replace(/^\/+|\/+$/g, '').split('/')
  if (!sectionSlug) return { section: 'review', reviewStep: 0 }
  if (sectionSlug === 'review') return { section: 'review', reviewStep: reviewStepBySlug[reviewSlug ?? 'table'] ?? 0 }
  const section = (Object.keys(sectionPaths) as SectionKey[]).find((key) => sectionPaths[key] === `/${sectionSlug}`)
  return section ? { section, reviewStep: 0 } : { section: 'review', reviewStep: 0 }
}

export const getInitialRoutePath = () => pathForRoute(parseRoute(window.location.pathname))
export const routeChangeEvent = 'poker-review-route-change'
export const subscribeToRoute = (onStoreChange: () => void) => {
  const notify = () => onStoreChange()
  window.addEventListener('popstate', notify)
  window.addEventListener(routeChangeEvent, notify)
  return () => {
    window.removeEventListener('popstate', notify)
    window.removeEventListener(routeChangeEvent, notify)
  }
}
export const getRouteSnapshot = () => getInitialRoutePath()
export const getServerRouteSnapshot = () => sectionPaths.review
export const updateBrowserRoute = (nextPath: string, replace = false) => {
  window.history[replace ? 'replaceState' : 'pushState'](null, '', nextPath)
  window.dispatchEvent(new Event(routeChangeEvent))
}

export const playerTypeLabels: Record<PlayerType, string> = {
  TIGHT_AGGRESSIVE: '紧凶',
  LOOSE_AGGRESSIVE: '松凶',
  TIGHT_PASSIVE: '紧弱',
  LOOSE_PASSIVE: '松弱',
  GTO: 'GTO',
  UNKNOWN: '未知',
}
export const playerTypeOptions: SelectOption<PlayerType>[] = (Object.entries(playerTypeLabels) as Array<[PlayerType, string]>).map(([value, label]) => ({
  value,
  label,
}))

export const gameTypeLabels: Record<GameType, string> = {
  TOURNAMENT: '锦标赛',
  CASH: '现金局',
}

export const tournamentStageLabels: Record<TournamentStage, string> = {
  EARLY: '前期',
  BUBBLE: '泡沫期',
  ITM: '奖励圈',
  FT: '决赛桌',
}

export const actionTypeLabels: Record<ActionType, string> = {
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

export const patternTypeLabels = {
  PREFLOP_OPEN: '翻前开池',
  CBET: '持续下注',
  CHECK_RAISE: '过牌加注',
  RIVER_ALLIN: '河牌全下',
  '3BET': '再加注',
  '4BET': '四次加注',
  FLOAT: '浮动跟注',
  SLOW_PLAY: '慢打',
} as const

export const adjustmentTypeLabels: Record<AdjustmentType, string> = {
  PREFLOP: '翻前',
  FLOP: '翻牌',
  TURN: '转牌',
  RIVER: '河牌',
  GENERAL: '通用',
}

export const adjustmentScopeLabels: Record<AdjustmentScope, string> = {
  OPEN: '开池',
  '3BET': '再加注',
  CALL: '跟注',
  BET: '下注',
  RAISE: '加注',
  CHECK: '过牌',
  FOLD: '弃牌',
}

export const strategyOutcomeLabels: Record<StrategyOutcome, string> = {
  WIN: '盈利',
  LOSS: '亏损',
  DRAW: '持平',
}
export const strategyOutcomeOptions: SelectOption<StrategyOutcome>[] = [
  { value: 'WIN', label: strategyOutcomeLabels.WIN },
  { value: 'LOSS', label: strategyOutcomeLabels.LOSS },
  { value: 'DRAW', label: strategyOutcomeLabels.DRAW },
]

export const boardTextureLabels: Record<string, string> = {
  ANY: '不限牌面',
  dry: '干燥牌面',
  wet: '湿润牌面',
}

export const positionLabels: Record<Position, string> = {
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
export const adjustmentTypeOptions: SelectOption<AdjustmentType>[] = (['PREFLOP', 'FLOP', 'TURN', 'RIVER', 'GENERAL'] as AdjustmentType[]).map((value) => ({
  value,
  label: adjustmentTypeLabels[value],
}))
export const adjustmentScopeOptions: SelectOption<AdjustmentScope>[] = (['OPEN', '3BET', 'CALL', 'BET', 'RAISE', 'CHECK', 'FOLD'] as AdjustmentScope[]).map((value) => ({
  value,
  label: adjustmentScopeLabels[value],
}))

export const tablePositions: Record<TableSize, Position[]> = {
  2: ['BTN', 'BB'],
  3: ['BTN', 'SB', 'BB'],
  4: ['CO', 'BTN', 'SB', 'BB'],
  5: ['HJ', 'CO', 'BTN', 'SB', 'BB'],
  6: ['LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  7: ['UTG', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  8: ['UTG', 'UTG1', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  9: ['UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
}
export const preflopActionPositions: Position[] = ['UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB']
export const postflopActionPositions: Position[] = ['SB', 'BB', 'UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN']
export const tableSizeOptions: TableSize[] = [2, 3, 4, 5, 6, 7, 8, 9]
export const toTableSize = (value: number): TableSize => (tableSizeOptions.includes(value as TableSize) ? (value as TableSize) : 6)
export const gameTypeOptions: SelectOption<GameType>[] = [
  { value: 'TOURNAMENT', label: '锦标赛' },
  { value: 'CASH', label: '现金局' },
]
export const tournamentStageOptions: SelectOption<TournamentStage>[] = [
  { value: 'EARLY', label: tournamentStageLabels.EARLY },
  { value: 'BUBBLE', label: tournamentStageLabels.BUBBLE },
  { value: 'ITM', label: tournamentStageLabels.ITM },
  { value: 'FT', label: tournamentStageLabels.FT },
]
export const sizeUnitOptions: SelectOption<SizeUnit>[] = [
  { value: 'BB', label: 'BB' },
  { value: 'ABSOLUTE', label: '筹码量' },
]

export const streetLabels: Record<Street, string> = {
  PREFLOP: '翻前',
  FLOP: '翻牌',
  TURN: '转牌',
  RIVER: '河牌',
}
export const previousStreets: Record<Street, Street[]> = {
  PREFLOP: [],
  FLOP: ['PREFLOP'],
  TURN: ['PREFLOP', 'FLOP'],
  RIVER: ['PREFLOP', 'FLOP', 'TURN'],
}
export const dealtStreetOrder: DealtStreet[] = ['FLOP', 'TURN', 'RIVER']
export const actionTypeOptionsByStreet: Record<Street, ActionType[]> = {
  PREFLOP: ['FOLD', 'CALL', 'RAISE', 'ALLIN'],
  FLOP: ['FOLD', 'CALL', 'RAISE', 'ALLIN'],
  TURN: ['FOLD', 'CALL', 'RAISE', 'ALLIN'],
  RIVER: ['FOLD', 'CALL', 'RAISE', 'ALLIN'],
}
export const defaultActionTypeByStreet: Record<Street, ActionType> = {
  PREFLOP: 'FOLD',
  FLOP: 'FOLD',
  TURN: 'FOLD',
  RIVER: 'FOLD',
}
export const nonSizingActionTypes = new Set<ActionType>(['FOLD'])
export const lockedSizingActionTypes = new Set<ActionType>(['ALLIN'])

export const suitOptions: CardSuit[] = ['黑桃', '红桃', '方块', '梅花']
export const rankOptions: CardRank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']
export const suitImages: Record<CardSuit, string> = {
  黑桃: '/suits/spade.svg',
  红桃: '/suits/heart.svg',
  方块: '/suits/diamond.svg',
  梅花: '/suits/club.svg',
}

export const splitCards = (value: string) => value.split(/\s+/).filter(Boolean)
export const readCard = (value: string): { suit: CardSuit | ''; rank: CardRank | '' } => {
  const suit = suitOptions.find((item) => value.startsWith(item)) ?? ''
  const rawRank = suit ? value.slice(suit.length) : value.startsWith('·') ? value.slice(1) : ''
  return {
    suit,
    rank: rankOptions.includes(rawRank as CardRank) ? (rawRank as CardRank) : '',
  }
}
export const writeCards = (cards: string[]) => cards.filter((card) => card && card !== '·').join(' ')
export const replaceCardAt = (value: string, index: number, nextCard: string) => {
  const cards = splitCards(value)
  cards[index] = nextCard
  return writeCards(cards)
}
export const hasCompleteCards = (value: string, count: number) =>
  splitCards(value).length === count && splitCards(value).every((card) => {
    const parsed = readCard(card)
    return Boolean(parsed.suit && parsed.rank)
  })
export const sortPlayersByPosition = (players: HandPlayer[], positions: Position[]) =>
  [...players].sort((first, second) => {
    const firstIndex = positions.indexOf(first.position)
    const secondIndex = positions.indexOf(second.position)
    return (firstIndex === -1 ? 99 : firstIndex) - (secondIndex === -1 ? 99 : secondIndex)
  })
export const getPlayersForStreet = (street: Street, players: HandPlayer[], actions: HandAction[], positions: Position[]) => {
  const foldedPlayerIds = new Set(
    actions
      .filter((action) => previousStreets[street].includes(action.street) && action.actionType === 'FOLD')
      .map((action) => action.playerId),
  )
  const actionPositions = street === 'PREFLOP' ? preflopActionPositions : postflopActionPositions
  const streetPositions = actionPositions.filter((position) => positions.includes(position))
  return sortPlayersByPosition(players.filter((player) => !foldedPlayerIds.has(player.id)), streetPositions)
}

export const normalizeActionType = (actionType: ActionType): ActionType => {
  if (actionType === 'OPEN' || actionType === 'BET' || actionType === '3BET' || actionType === '4BET') return 'RAISE'
  if (actionType === 'CHECK') return 'CALL'
  return actionType
}

export const getAvailableStreets = (handInfo: HandInfo): Street[] => {
  const streets: Street[] = ['PREFLOP']
  if (hasCompleteCards(handInfo.boardFlop, 3)) streets.push('FLOP')
  if (hasCompleteCards(handInfo.boardFlop, 3) && hasCompleteCards(handInfo.boardTurn, 1)) streets.push('TURN')
  if (hasCompleteCards(handInfo.boardFlop, 3) && hasCompleteCards(handInfo.boardTurn, 1) && hasCompleteCards(handInfo.boardRiver, 1)) streets.push('RIVER')
  return streets
}

export const getAllowedActionsForHand = (handInfo: HandInfo, currentActions: HandAction[]) => {
  const availableStreets = new Set(getAvailableStreets(handInfo))
  return currentActions.filter((action) => availableStreets.has(action.street))
}

export const getDefaultActionSize = (street: Street, actionType: ActionType) => (nonSizingActionTypes.has(actionType) ? 0 : street === 'PREFLOP' ? 2.2 : 1)
export const getPreviousActionSize = (street: Street, playerId: string, players: HandPlayer[], actions: HandAction[], positions: Position[]) => {
  const streetActions = actions.filter((action) => action.street === street)
  const playerOrder = getPlayersForStreet(street, players, actions, positions)
  const playerIndex = playerOrder.findIndex((item) => item.id === playerId)
  const previousPlayer = playerIndex > 0 ? playerOrder[playerIndex - 1] : null
  const previousAction = previousPlayer ? streetActions.find((action) => action.playerId === previousPlayer.id) : undefined
  return previousAction && !nonSizingActionTypes.has(normalizeActionType(previousAction.actionType)) ? previousAction.actionSize : undefined
}

export const getResolvedActionSize = (
  street: Street,
  actionType: ActionType,
  currentSize: number,
  playerStack: number,
  previousSize?: number,
) => {
  const normalizedActionType = normalizeActionType(actionType)
  if (normalizedActionType === 'FOLD') return 0
  if (normalizedActionType === 'ALLIN') return playerStack
  if (normalizedActionType === 'CALL') return (previousSize ?? currentSize) || getDefaultActionSize(street, normalizedActionType)
  return currentSize || getDefaultActionSize(street, normalizedActionType)
}

export const createActionDraft = (street: Street, playerId = '', actionType = defaultActionTypeByStreet[street]): ActionDraft => ({
  playerId,
  street,
  actionType,
  actionSize: getDefaultActionSize(street, actionType),
  sizeUnit: 'BB',
})
export const actionDraftKey = (street: Street, playerId: string) => `${street}:${playerId}`

export const emptyPlayer: PlayerDraft = {
  name: '',
  position: 'BTN',
  playerType: 'UNKNOWN',
  startingStack: 30,
  isHero: false,
  holeCards: '',
  rangeNotes: '',
}

export const emptyStrategyDraft: StrategyDraft = {
  playerId: '',
  adjustmentType: 'PREFLOP',
  adjustmentScope: '3BET',
  originalStrategy: '标准 GTO 策略',
  adjustedStrategy: '',
  reason: '',
  expectedEvImprovement: 1.5,
  confidenceLevel: 70,
}
