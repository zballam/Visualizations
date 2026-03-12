import type { TreeGraph, TreeNodeData } from './types'

function levelNodeCount(branchingFactor: number, depth: number) {
  return depth === 0 ? 1 : branchingFactor ** depth
}

export function buildTreeGraph(depth: number, branchingFactor: number): TreeGraph {
  const safeDepth = Math.max(1, Math.min(depth, 4))
  const safeBranchingFactor = Math.max(2, Math.min(branchingFactor, 3))
  const nodes: TreeNodeData[] = []

  let nextLabel = 1
  let nextNodeIdNumber = 2
  let currentLevelIds = ['node-1']

  for (let level = 0; level < safeDepth; level += 1) {
    const nodesInLevel = levelNodeCount(safeBranchingFactor, level)
    const xStep = 1 / (nodesInLevel + 1)
    const y = safeDepth === 1 ? 0.5 : level / (safeDepth - 1)
    const nextLevelIds: string[] = []

    for (let index = 0; index < currentLevelIds.length; index += 1) {
      const id = currentLevelIds[index]
      const label = String(nextLabel)
      nextLabel += 1

      const children =
        level === safeDepth - 1
          ? []
          : Array.from({ length: safeBranchingFactor }, () => {
              const childId = `node-${nextNodeIdNumber}`
              nextNodeIdNumber += 1
              nextLevelIds.push(childId)
              return childId
            })

      nodes.push({
        id,
        label,
        depth: level,
        x: xStep * (index + 1),
        y,
        children,
      })
    }

    currentLevelIds = nextLevelIds
  }

  return {
    rootId: 'node-1',
    nodes,
  }
}
