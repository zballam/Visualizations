export type TraversalAlgorithm = 'bfs' | 'dfs'
export type FrontierKind = 'queue' | 'stack'

export type TraversalActionType =
  | 'start'
  | 'frontier-add'
  | 'frontier-remove'
  | 'visit'
  | 'complete'
  | 'goal'

export interface TraversalAction {
  type: TraversalActionType
  nodeId?: string
  sourceId?: string
  note?: string
}

export interface TraversalMetrics {
  visitedCount: number
  operations: number
  frontierSize: number
  maxFrontierSize: number
}

export interface TraversalFrame {
  step: number
  action: TraversalAction
  currentId?: string
  frontierIds: string[]
  discoveredIds: string[]
  visitedIds: string[]
  order: string[]
  pathIds?: string[]
  isComplete: boolean
  metrics: TraversalMetrics
}

export interface TraversalTimeline {
  algorithm: TraversalAlgorithm
  frontierKind: FrontierKind
  frames: TraversalFrame[]
}

export interface TreeNodeData {
  id: string
  label: string
  depth: number
  x: number
  y: number
  children: string[]
}

export interface TreeGraph {
  rootId: string
  nodes: TreeNodeData[]
}

export type MazePattern = 'classic' | 'open' | 'corridor' | 'branching' | 'dead-ends'

export interface MazeCellData {
  id: string
  row: number
  col: number
  walkable: boolean
  start?: boolean
  goal?: boolean
}

export interface MazeGrid {
  rows: number
  cols: number
  pattern: MazePattern
  cells: MazeCellData[]
  startId: string
  goalId: string
}
