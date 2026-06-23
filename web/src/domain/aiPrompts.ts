import type { ActionType, HandAction, HandInfo, HandPlayer, SizeUnit, Street } from '../mockApi'
import {
  actionTypeLabels,
  getPlayersForStreet,
  getPositionLabel,
  playerTypeLabels,
  streetLabels,
  tablePositions,
  type TableSize,
} from './review'

export type ActionPromptMode = 'suggest' | 'review'

type BuildActionCoachPromptParams = {
  mode: ActionPromptMode
  tableSize: TableSize
  hand: HandInfo
  players: HandPlayer[]
  actions: HandAction[]
  street: Street
  targetPlayer: HandPlayer
  reviewAction?: {
    actionType: ActionType
    actionSize: number
    sizeUnit: SizeUnit
  }
}

export type ActionCoachPrompt = {
  mode: ActionPromptMode
  modeLabel: string
  systemPrompt: string
  userPrompt: string
  combinedPrompt: string
}

const streetOrder: Street[] = ['PREFLOP', 'FLOP', 'TURN', 'RIVER']

const formatActionSize = (actionSize: number, sizeUnit: SizeUnit) => {
  if (!Number.isFinite(actionSize) || actionSize <= 0) return ''
  const normalized = Number(actionSize.toFixed(1))
  return sizeUnit === 'ABSOLUTE' ? `${normalized}筹码` : `${normalized}${sizeUnit}`
}

const formatActionLabel = (actionType: ActionType, actionSize: number, sizeUnit: SizeUnit) => {
  const sizeText = formatActionSize(actionSize, sizeUnit)
  return `${actionTypeLabels[actionType]}${sizeText ? ` ${sizeText}` : ''}`
}

const formatBoardByStreet = (hand: HandInfo, street: Street) => {
  if (street === 'PREFLOP') return '当前街公共牌：无'
  const segments = [`翻牌：${hand.boardFlop || '未记录'}`]
  if (street === 'TURN' || street === 'RIVER') segments.push(`转牌：${hand.boardTurn || '未记录'}`)
  if (street === 'RIVER') segments.push(`河牌：${hand.boardRiver || '未记录'}`)
  return segments.join('\n')
}

const sortPlayersForTable = (players: HandPlayer[], tableSize: TableSize) => {
  const order = tablePositions[tableSize]
  return [...players].sort((left, right) => order.indexOf(left.position) - order.indexOf(right.position))
}

const formatPlayers = (players: HandPlayer[], tableSize: TableSize, hand: HandInfo) =>
  sortPlayersForTable(players, tableSize)
    .map((player) => {
      const role = player.isHero ? 'Hero' : 'Opponent'
      const holeCards = player.isHero ? hand.heroCards : player.holeCards || '未知'
      return `- ${player.name} | 位置: ${getPositionLabel(player.position, tableSize)} | 身份: ${role} | 玩家类型: ${playerTypeLabels[player.playerType]} | 起始筹码: ${player.startingStack}BB | 手牌: ${holeCards}`
    })
    .join('\n')

const formatActionHistory = (actions: HandAction[], players: HandPlayer[], tableSize: TableSize, street: Street) => {
  const playerById = new Map(players.map((player) => [player.id, player]))
  const visibleStreets = streetOrder.slice(0, streetOrder.indexOf(street) + 1)

  return visibleStreets
    .map((currentStreet) => {
      const streetActions = actions
        .filter((action) => action.street === currentStreet)
        .sort((left, right) => left.actionOrder - right.actionOrder)

      if (streetActions.length === 0) {
        return `【${streetLabels[currentStreet]}行动】\n- 暂无已保存行动`
      }

      const lines = streetActions.map((action, index) => {
        const player = playerById.get(action.playerId)
        const playerName = player?.name ?? action.playerId
        const positionLabel = player ? getPositionLabel(player.position, tableSize) : '未知位置'
        return `${index + 1}. ${playerName} (${positionLabel})：${formatActionLabel(action.actionType, action.actionSize, action.sizeUnit)}`
      })

      return `【${streetLabels[currentStreet]}行动】\n${lines.join('\n')}`
    })
    .join('\n\n')
}

export const buildActionCoachPrompt = ({
  mode,
  tableSize,
  hand,
  players,
  actions,
  street,
  targetPlayer,
  reviewAction,
}: BuildActionCoachPromptParams): ActionCoachPrompt => {
  const actionOrderPlayers = getPlayersForStreet(street, players, actions, tablePositions[tableSize])
  const actionOrderText = actionOrderPlayers.map((player) => `${player.name}(${getPositionLabel(player.position, tableSize)})`).join(' -> ')
  const modeLabel = mode === 'suggest' ? 'AI建议' : 'AI复核'
  const taskInstruction =
    mode === 'suggest'
      ? [
          '任务：请站在当前玩家视角，判断该玩家此刻最优行动。',
          '可选行动仅限：弃牌、跟注、加注、全下。',
          '如果建议加注或全下，请给出推荐尺度，优先用 BB 表达；若需要也可以补充筹码量。',
          '不要编造未提供的信息；如果关键数据缺失，请明确写出你基于哪些默认假设给出建议。',
          '请重点考虑位置、盲注、有效筹码、玩家类型、当前街道前位行动、Hero 手牌、公共牌结构以及锦标赛阶段。',
          '请只回答当前这个决策点，不要泛泛地分析整手牌。',
          '请按以下格式输出：\n1. 建议行动：\n2. 建议尺度：\n3. 核心理由：\n4. 备选行动：\n5. 需要补充确认的信息：',
        ].join('\n')
      : [
          '任务：请站在当前玩家视角，复核该玩家已经选择的行动是否合理。',
          '如果当前行动不够好，请指出更优行动和更优尺度，并说明为什么。',
          '不要编造未提供的信息；如果关键数据缺失，请明确写出你基于哪些默认假设做复核。',
          '请重点考虑位置、盲注、有效筹码、玩家类型、当前街道前位行动、Hero 手牌、公共牌结构以及锦标赛阶段。',
          '请只复核当前这个决策点，不要泛泛地分析整手牌。',
          '请按以下格式输出：\n1. 复核结论：\n2. 评分（0-100）：\n3. 当前动作问题：\n4. 更优行动：\n5. 更优尺度：\n6. 核心理由：\n7. 需要补充确认的信息：',
        ].join('\n')

  const reviewActionLine =
    mode === 'review' && reviewAction
      ? `当前待复核动作：${targetPlayer.name} (${getPositionLabel(targetPlayer.position, tableSize)}) -> ${formatActionLabel(
          reviewAction.actionType,
          reviewAction.actionSize,
          reviewAction.sizeUnit,
        )}`
      : `当前待决策玩家：${targetPlayer.name} (${getPositionLabel(targetPlayer.position, tableSize)})`

  const systemPrompt = [
    '你是一名严谨、务实的德州扑克职业教练。',
    '你需要基于给定的牌桌信息、玩家信息、手牌信息和行动信息，对当前决策点给出建议或复核。',
    '优先保证逻辑一致、信息不臆造、结论可执行。',
    '回答必须使用简体中文。',
  ].join('\n')

  const userPrompt = [
    `任务类型：${modeLabel}`,
    taskInstruction,
    '',
    '【牌桌信息】',
    `桌人数：${tableSize}人桌`,
    `游戏类型：${hand.gameType}`,
    `锦标赛阶段：${hand.tournamentStage}`,
    `盲注：${hand.smallBlind}/${hand.bigBlind}${hand.ante === '' ? '' : `，Ante ${hand.ante}`}`,
    `有效筹码：${hand.effectiveStack}BB`,
    '',
    '【玩家信息】',
    formatPlayers(players, tableSize, hand),
    '',
    '【手牌与公共牌】',
    `Hero 手牌：${hand.heroCards}`,
    formatBoardByStreet(hand, street),
    '',
    '【当前街道信息】',
    `当前街道：${streetLabels[street]}`,
    `当前街行动顺序：${actionOrderText || '暂无可行动玩家'}`,
    reviewActionLine,
    '',
    '【已保存行动历史】',
    formatActionHistory(actions, players, tableSize, street),
  ].join('\n')

  return {
    mode,
    modeLabel,
    systemPrompt,
    userPrompt,
    combinedPrompt: `System Prompt:\n${systemPrompt}\n\nUser Prompt:\n${userPrompt}`,
  }
}
