import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import type { FormEvent } from 'react'
import {
  Brain,
  Library,
  LineChart,
  Loader2,
  Menu,
  Target,
  UserCircle,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import './App.css'
import { apiClient } from './apiClient'
import { AppContext, type AppContextValue } from './AppContext'
import { AuthPage } from './pages/Auth/AuthPage'
import { LibraryPage } from './pages/Library/LibraryPage'
import { OpponentsPage } from './pages/Opponents/OpponentsPage'
import { ReviewShell } from './pages/Review/ReviewShell/ReviewShell'
import { StatsPage } from './pages/Stats/StatsPage'
import { StrategiesPage } from './pages/Strategies/StrategiesPage'
import {
  actionDraftKey,
  createActionDraft,
  disabledNavSections,
  emptyPlayer,
  emptyStrategyDraft,
  getAllowedActionsForHand,
  getDefaultActionSize,
  getInitialRoutePath,
  getPreviousActionSize,
  getResolvedActionSize,
  getRouteSnapshot,
  getServerRouteSnapshot,
  hasCompleteCards,
  normalizeActionType,
  parseRoute,
  pathForRoute,
  positionLabels,
  reviewSteps,
  splitCards,
  streetLabels,
  subscribeToRoute,
  tablePositions,
  toTableSize,
  updateBrowserRoute,
  type DealtStreet,
  type Notice,
  type NoticeType,
  type ReviewStep,
  type RouteState,
  type TableSize,
} from './domain/review'
import type {
  ActionDraft,
  AuthState,
  HandAction,
  HandFilters,
  HandInfo,
  HandPlayer,
  HandSummary,
  OpponentProfile,
  PlayerDraft,
  Position,
  SectionKey,
  StrategyAdjustment,
  StrategyDraft,
  StrategyEvaluation,
  StrategyOutcome,
  Street,
  TableTemplate,
  UserProfile,
} from './mockApi'

const navItems: Array<{ key: SectionKey; label: string; icon: typeof Brain }> = [
  { key: 'auth', label: '用户中心', icon: UserCircle },
  { key: 'review', label: '复盘工作台', icon: Brain },
  { key: 'library', label: '手牌库', icon: Library },
  { key: 'opponents', label: '对手画像', icon: Users },
  { key: 'strategies', label: '策略库', icon: Target },
  { key: 'bankroll', label: '资金管理', icon: Wallet },
  { key: 'stats', label: 'AI 结果库', icon: LineChart },
]

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
    if (splitCards(hand.boardFlop).length > 0 && !hasCompleteCards(hand.boardFlop, 3)) return '若填写公共牌，请完整选择翻牌面 3 张牌'
    if (splitCards(hand.boardTurn).length > 0 && !hasCompleteCards(hand.boardTurn, 1)) return '若填写转牌，请完整选择 1 张牌'
    if (splitCards(hand.boardRiver).length > 0 && !hasCompleteCards(hand.boardRiver, 1)) return '若填写河牌，请完整选择 1 张牌'
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
    const allowedActions = getAllowedActionsForHand(hand, actions)
    if (allowedActions.length !== actions.length) {
      setActions(allowedActions)
      setSelectedActionId((current) => (allowedActions.some((action) => action.id === current) ? current : allowedActions[0]?.id ?? ''))
    }
    const savedHand = hand.id ? await apiClient.updateHand(hand) : await apiClient.createHand(hand)
    const saved = { ...savedHand, analysisDirty: true }
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

  const startAddPlayer = (position: Position = firstOpenPosition) => {
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
      const nextActionType = patch.actionType ? normalizeActionType(patch.actionType) : normalizeActionType(base.actionType)
      const next = {
        ...base,
        ...patch,
        playerId,
        street,
        actionType: nextActionType,
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
    const normalizedActionType = normalizeActionType(draft.actionType)
    const previousSize = getPreviousActionSize(street, player.id, visiblePlayers, actions, availablePositions)
    const resolvedActionSize = getResolvedActionSize(street, normalizedActionType, Number(draft.actionSize), player.startingStack, previousSize)
    const payload: ActionDraft = {
      playerId: player.id,
      street,
      actionType: normalizedActionType,
      actionSize: resolvedActionSize,
      sizeUnit: draft.sizeUnit === 'PERCENT' ? 'BB' : draft.sizeUnit,
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

  const saveBoardCard = async (street: DealtStreet, value: string) => {
    if (!hand) return
    updateHand(boardKeys[street], value)
    if (!hasCompleteCards(value, boardCardCounts[street])) return
    setBusy(true)
    const saved = await apiClient.updateHand({ ...hand, [boardKeys[street]]: value, analysisDirty: true })
    setHand(saved)
    setEditingBoardStreet(null)
    showNotice(`${streetLabels[street]}已发出，可以继续录入行动`)
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
  const appContextValue: AppContextValue = {
    actions,
    actionDrafts,
    activeSection,
    analyzedActions,
    availablePositions,
    auth,
    authForm,
    authMode,
    busy,
    currentHand,
    editingActionId,
    editingBoardStreet,
    editingPlayerId,
    editingStrategyId,
    evaluationDraft,
    evaluations,
    handFilters,
    handList,
    hasAiResults,
    isAddingPlayer,
    isHandInfoComplete,
    isTableComplete,
    opponents,
    opponentHands,
    playerDraft,
    playerDraftPosition,
    players,
    profile,
    reviewStep,
    selectedAction,
    selectedActionId,
    selectedOpponent,
    selectedOpponentId,
    selectedStrategy,
    selectedTableTemplateId,
    strategies,
    strategyDraft,
    tableEntryMode,
    tableIsFull,
    tableSize,
    tableTemplateName,
    tableTemplates,
    viewingPlayerId,
    visiblePlayers,

    addOrUpdatePlayer,
    analyzeHand,
    analyzeOpponent,
    analyzeStreet,
    applyTableTemplate,
    cancelPlayerEditing,
    changePassword,
    changeTableSize,
    createEvaluation,
    createNewTableDraft,
    createOrUpdateStrategy,
    createStrategyFromOpponent,
    deleteHand,
    deletePlayer,
    deleteStrategy,
    editPlayer,
    editStrategy,
    getHandInfoValidationMessage,
    getTableValidationMessage,
    goToReviewStep,
    inspectHand,
    loadSavedTable,
    logout,
    navigateToRoute,
    refreshHandList,
    refreshStrategies,
    resetHandFilters,
    saveBoardCard,
    saveCurrentTableTemplate,
    saveHand,
    savePlayerAction,
    saveTableAndContinue,
    setActionDrafts,
    setAuthForm,
    setAuthMode,
    setEditingActionId,
    setEditingBoardStreet,
    setEvaluationDraft,
    setEvaluationStrategyId,
    setHandFilters,
    setPlayerDraft,
    setSelectedActionId,
    setSelectedOpponentId,
    setSelectedTableTemplateId,
    setStrategyDraft,
    setTableTemplateName,
    setViewingPlayerId,
    showNotice,
    startAddPlayer,
    submitAuth,
    toggleStrategy,
    updateActionDraft,
    updateHand,
  }

  return (
    <AppContext.Provider value={appContextValue}>
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

          {activeSection === 'auth' && <AuthPage />}
          {activeSection === 'review' && <ReviewShell />}
          {activeSection === 'library' && <LibraryPage />}
          {activeSection === 'opponents' && <OpponentsPage />}
          {activeSection === 'strategies' && <StrategiesPage />}
          {activeSection === 'stats' && <StatsPage />}
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
    </AppContext.Provider>
  )
}

export default App
