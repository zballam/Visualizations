import type { MazeGrid, TreeGraph, TraversalAlgorithm, TraversalFrame, TraversalTimeline } from './types'

function frontierKindFor(algorithm: TraversalAlgorithm) {
  return algorithm === 'bfs' ? 'queue' : 'stack'
}

function removeFrontier(frontier: string[], algorithm: TraversalAlgorithm) {
  return algorithm === 'bfs' ? frontier.shift() : frontier.pop()
}

function createFrame({
  frames,
  action,
  frontier,
  discovered,
  visited,
  order,
  currentId,
  pathIds,
  maxFrontierSize,
  isComplete = false,
}: {
  frames: TraversalFrame[]
  action: TraversalFrame['action']
  frontier: string[]
  discovered: Set<string>
  visited: Set<string>
  order: string[]
  currentId?: string
  pathIds?: string[]
  maxFrontierSize: number
  isComplete?: boolean
}) {
  frames.push({
    step: frames.length,
    action,
    currentId,
    frontierIds: [...frontier],
    discoveredIds: Array.from(discovered),
    visitedIds: Array.from(visited),
    order: [...order],
    pathIds,
    isComplete,
    metrics: {
      visitedCount: visited.size,
      operations: frames.length + 1,
      frontierSize: frontier.length,
      maxFrontierSize,
    },
  })
}

function reconstructPath(goalId: string, previous: Map<string, string | undefined>) {
  const path: string[] = []
  let current: string | undefined = goalId
  while (current) {
    path.push(current)
    current = previous.get(current)
  }
  return path.reverse()
}

export function buildTreeTraversalTimeline(tree: TreeGraph, algorithm: TraversalAlgorithm): TraversalTimeline {
  const nodeMap = new Map(tree.nodes.map((node) => [node.id, node]))
  const frontier = [tree.rootId]
  const discovered = new Set([tree.rootId])
  const visited = new Set<string>()
  const order: string[] = []
  const frames: TraversalFrame[] = []
  let maxFrontierSize = frontier.length

  createFrame({
    frames,
    action: { type: 'start', nodeId: tree.rootId, note: 'Traversal ready.' },
    frontier,
    discovered,
    visited,
    order,
    currentId: tree.rootId,
    maxFrontierSize,
  })

  createFrame({
    frames,
    action: { type: 'frontier-add', nodeId: tree.rootId, sourceId: tree.rootId, note: 'Add root to the frontier.' },
    frontier,
    discovered,
    visited,
    order,
    currentId: tree.rootId,
    maxFrontierSize,
  })

  while (frontier.length > 0) {
    const current = removeFrontier(frontier, algorithm)
    if (!current) break

    createFrame({
      frames,
      action: { type: 'frontier-remove', nodeId: current, note: `Remove ${current} from the ${frontierKindFor(algorithm)}.` },
      frontier,
      discovered,
      visited,
      order,
      currentId: current,
      maxFrontierSize,
    })

    if (visited.has(current)) continue
    visited.add(current)
    order.push(current)

    createFrame({
      frames,
      action: { type: 'visit', nodeId: current, note: `Visit ${nodeMap.get(current)?.label ?? current}.` },
      frontier,
      discovered,
      visited,
      order,
      currentId: current,
      maxFrontierSize,
    })

    const children = nodeMap.get(current)?.children ?? []
    const additions = algorithm === 'dfs' ? [...children].reverse() : children

    for (const childId of additions) {
      if (discovered.has(childId)) continue
      discovered.add(childId)
      frontier.push(childId)
      maxFrontierSize = Math.max(maxFrontierSize, frontier.length)
      createFrame({
        frames,
        action: { type: 'frontier-add', nodeId: childId, sourceId: current, note: `Add ${childId} to the ${frontierKindFor(algorithm)}.` },
        frontier,
        discovered,
        visited,
        order,
        currentId: current,
        maxFrontierSize,
      })
    }
  }

  createFrame({
    frames,
    action: { type: 'complete', note: 'Traversal complete.' },
    frontier,
    discovered,
    visited,
    order,
    maxFrontierSize,
    isComplete: true,
  })

  return {
    algorithm,
    frontierKind: frontierKindFor(algorithm),
    frames,
  }
}

export function buildMazeTraversalTimeline(maze: MazeGrid, algorithm: TraversalAlgorithm): TraversalTimeline {
  const cellMap = new Map(maze.cells.map((cell) => [cell.id, cell]))
  const frontier = [maze.startId]
  const discovered = new Set([maze.startId])
  const visited = new Set<string>()
  const previous = new Map<string, string | undefined>([[maze.startId, undefined]])
  const order: string[] = []
  const frames: TraversalFrame[] = []
  let maxFrontierSize = frontier.length

  const getNeighbors = (id: string) => {
    const cell = cellMap.get(id)
    if (!cell) return []
    const deltas = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ]
    return deltas
      .map(([dr, dc]) => cellMap.get(`${cell.row + dr}-${cell.col + dc}`))
      .filter((neighbor): neighbor is NonNullable<typeof neighbor> => Boolean(neighbor?.walkable))
      .map((neighbor) => neighbor.id)
  }

  createFrame({
    frames,
    action: { type: 'start', nodeId: maze.startId, note: 'Maze search ready.' },
    frontier,
    discovered,
    visited,
    order,
    currentId: maze.startId,
    maxFrontierSize,
  })

  createFrame({
    frames,
    action: { type: 'frontier-add', nodeId: maze.startId, sourceId: maze.startId, note: 'Add the start cell to the frontier.' },
    frontier,
    discovered,
    visited,
    order,
    currentId: maze.startId,
    maxFrontierSize,
  })

  while (frontier.length > 0) {
    const current = removeFrontier(frontier, algorithm)
    if (!current) break

    createFrame({
      frames,
      action: { type: 'frontier-remove', nodeId: current, note: `Remove ${current} from the ${frontierKindFor(algorithm)}.` },
      frontier,
      discovered,
      visited,
      order,
      currentId: current,
      maxFrontierSize,
    })

    if (visited.has(current)) continue
    visited.add(current)
    order.push(current)

    createFrame({
      frames,
      action: { type: 'visit', nodeId: current, note: `Visit cell ${current}.` },
      frontier,
      discovered,
      visited,
      order,
      currentId: current,
      maxFrontierSize,
    })

    if (current === maze.goalId) {
      const pathIds = reconstructPath(current, previous)
      createFrame({
        frames,
        action: { type: 'goal', nodeId: current, note: 'Goal reached.' },
        frontier,
        discovered,
        visited,
        order,
        currentId: current,
        pathIds,
        maxFrontierSize,
      })
      createFrame({
        frames,
        action: { type: 'complete', nodeId: current, note: 'Maze search complete.' },
        frontier,
        discovered,
        visited,
        order,
        currentId: current,
        pathIds,
        maxFrontierSize,
        isComplete: true,
      })
      return {
        algorithm,
        frontierKind: frontierKindFor(algorithm),
        frames,
      }
    }

    const neighbors = getNeighbors(current)
    const additions = algorithm === 'dfs' ? [...neighbors].reverse() : neighbors

    for (const neighborId of additions) {
      if (discovered.has(neighborId)) continue
      discovered.add(neighborId)
      previous.set(neighborId, current)
      frontier.push(neighborId)
      maxFrontierSize = Math.max(maxFrontierSize, frontier.length)
      createFrame({
        frames,
        action: { type: 'frontier-add', nodeId: neighborId, sourceId: current, note: `Add ${neighborId} to the ${frontierKindFor(algorithm)}.` },
        frontier,
        discovered,
        visited,
        order,
        currentId: current,
        maxFrontierSize,
      })
    }
  }

  createFrame({
    frames,
    action: { type: 'complete', note: 'No path to the goal was found.' },
    frontier,
    discovered,
    visited,
    order,
    maxFrontierSize,
    isComplete: true,
  })

  return {
    algorithm,
    frontierKind: frontierKindFor(algorithm),
    frames,
  }
}
