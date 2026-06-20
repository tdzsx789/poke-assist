import { createContext, useContext } from 'react'
import type { Dispatch, FormEvent, SetStateAction } from 'react'
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
  StrategyAdjustment,
  StrategyDraft,
  StrategyEvaluation,
  StrategyOutcome,
  Street,
  TableTemplate,
  UserProfile,
} from './mockApi'
import type { DealtStreet, RouteState, TableSize } from './domain/review'

export type AuthForm = {
  username: string
  email: string
  password: string
  newPassword: string
}

export type EvaluationDraft = {
  actualEv: number
  expectedEv: number
  outcome: StrategyOutcome
  wasAdjustmentApplied: boolean
  effectivenessRating: number
  notes: string
}

export type AppContextValue = {
  actions: HandAction[]
  actionDrafts: Record<string, ActionDraft>
  activeSection: RouteState['section']
  analyzedActions: HandAction[]
  availablePositions: Position[]
  auth: AuthState | null
  authForm: AuthForm
  authMode: 'login' | 'register'
  busy: boolean
  currentHand: HandInfo
  editingActionId: string | null
  editingBoardStreet: DealtStreet | null
  editingPlayerId: string | null
  editingStrategyId: string | null
  evaluationDraft: EvaluationDraft
  evaluations: StrategyEvaluation[]
  handFilters: HandFilters
  handList: HandSummary[]
  hasAiResults: boolean
  isAddingPlayer: boolean
  isHandInfoComplete: boolean
  isTableComplete: boolean
  opponents: OpponentProfile[]
  opponentHands: HandSummary[]
  playerDraft: PlayerDraft
  playerDraftPosition: Position
  players: HandPlayer[]
  profile: UserProfile | null
  reviewStep: RouteState['reviewStep']
  selectedAction: HandAction | undefined
  selectedActionId: string
  selectedOpponent: OpponentProfile | undefined
  selectedOpponentId: string
  selectedStrategy: StrategyAdjustment | undefined
  selectedTableTemplateId: string
  strategies: StrategyAdjustment[]
  strategyDraft: StrategyDraft
  tableEntryMode: 'create' | 'load' | null
  tableIsFull: boolean
  tableSize: TableSize
  tableTemplateName: string
  tableTemplates: TableTemplate[]
  viewingPlayerId: string | null
  visiblePlayers: HandPlayer[]

  addOrUpdatePlayer: (event: FormEvent<HTMLFormElement>) => Promise<void>
  analyzeHand: () => Promise<void>
  analyzeOpponent: (playerId: string) => Promise<void>
  analyzeStreet: (street: Street) => Promise<void>
  applyTableTemplate: (templateId: string, options?: { goToPlayers?: boolean }) => Promise<void>
  cancelPlayerEditing: () => void
  changePassword: () => Promise<void>
  changeTableSize: (nextSize: TableSize) => void
  createEvaluation: () => Promise<void>
  createNewTableDraft: () => Promise<void>
  createOrUpdateStrategy: (event: FormEvent<HTMLFormElement>) => Promise<void>
  createStrategyFromOpponent: (playerId: string) => Promise<void>
  deleteHand: (handId: string) => Promise<void>
  deletePlayer: (playerId: string) => Promise<void>
  deleteStrategy: (strategyId: string) => Promise<void>
  editPlayer: (player: HandPlayer) => void
  editStrategy: (strategy: StrategyAdjustment) => void
  getHandInfoValidationMessage: () => string
  getTableValidationMessage: () => string
  goToReviewStep: (nextStep: RouteState['reviewStep']) => void
  inspectHand: (handId: string, mode?: 'view' | 'edit') => Promise<void>
  loadSavedTable: (templateId: string) => Promise<void>
  logout: () => Promise<void>
  navigateToRoute: (next: RouteState, options?: { replace?: boolean }) => void
  refreshHandList: () => Promise<void>
  refreshStrategies: () => Promise<void>
  resetHandFilters: () => Promise<void>
  saveBoardCard: (street: DealtStreet, value: string) => Promise<void>
  saveCurrentTableTemplate: () => Promise<void>
  saveHand: () => Promise<void>
  savePlayerAction: (street: Street, player: HandPlayer, existingAction?: HandAction) => Promise<void>
  saveTableAndContinue: () => Promise<void>
  setActionDrafts: Dispatch<SetStateAction<Record<string, ActionDraft>>>
  setAuthForm: Dispatch<SetStateAction<AuthForm>>
  setAuthMode: Dispatch<SetStateAction<'login' | 'register'>>
  setEditingActionId: Dispatch<SetStateAction<string | null>>
  setEditingBoardStreet: Dispatch<SetStateAction<DealtStreet | null>>
  setEvaluationDraft: Dispatch<SetStateAction<EvaluationDraft>>
  setEvaluationStrategyId: Dispatch<SetStateAction<string>>
  setHandFilters: Dispatch<SetStateAction<HandFilters>>
  setPlayerDraft: Dispatch<SetStateAction<PlayerDraft>>
  setSelectedActionId: Dispatch<SetStateAction<string>>
  setSelectedOpponentId: Dispatch<SetStateAction<string>>
  setSelectedTableTemplateId: Dispatch<SetStateAction<string>>
  setStrategyDraft: Dispatch<SetStateAction<StrategyDraft>>
  setTableTemplateName: Dispatch<SetStateAction<string>>
  setViewingPlayerId: Dispatch<SetStateAction<string | null>>
  showNotice: (text: string, type?: 'success' | 'info' | 'error') => void
  startAddPlayer: (position?: Position) => void
  submitAuth: (event: FormEvent<HTMLFormElement>) => Promise<void>
  toggleStrategy: (strategyId: string) => Promise<void>
  updateActionDraft: (street: Street, playerId: string, patch: Partial<ActionDraft>, fallback?: ActionDraft) => void
  updateHand: <Key extends keyof HandInfo>(key: Key, value: HandInfo[Key]) => void
}

export const AppContext = createContext<AppContextValue | null>(null)

export function useAppContext() {
  const value = useContext(AppContext)
  if (!value) {
    throw new Error('useAppContext must be used within AppContextProvider')
  }
  return value
}
