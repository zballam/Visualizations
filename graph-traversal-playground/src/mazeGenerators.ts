import type { MazeCellData, MazeGrid, MazePattern } from './types'

function createEmptyGrid(rows: number, cols: number, pattern: MazePattern): MazeGrid {
  const safeRows = Math.max(7, Math.min(rows, 21))
  const safeCols = Math.max(7, Math.min(cols, 21))
  const cells: MazeCellData[] = []

  for (let row = 0; row < safeRows; row += 1) {
    for (let col = 0; col < safeCols; col += 1) {
      cells.push({
        id: `${row}-${col}`,
        row,
        col,
        walkable: true,
      })
    }
  }

  return {
    rows: safeRows,
    cols: safeCols,
    pattern,
    cells,
    startId: '1-1',
    goalId: `${safeRows - 2}-${safeCols - 2}`,
  }
}

function setEndpoints(grid: MazeGrid, startRow: number, startCol: number, goalRow: number, goalCol: number) {
  grid.startId = `${startRow}-${startCol}`
  grid.goalId = `${goalRow}-${goalCol}`
}

function createSeededRandom(seed: number) {
  let value = seed % 2147483647
  if (value <= 0) value += 2147483646
  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

function setWalkable(grid: MazeGrid, row: number, col: number, walkable: boolean) {
  const cell = grid.cells.find((entry) => entry.row === row && entry.col === col)
  if (!cell) return
  cell.walkable = walkable
}

function clearInnerArea(grid: MazeGrid) {
  for (let row = 1; row < grid.rows - 1; row += 1) {
    for (let col = 1; col < grid.cols - 1; col += 1) {
      setWalkable(grid, row, col, true)
    }
  }
}

function fillInnerArea(grid: MazeGrid, walkable: boolean) {
  for (let row = 1; row < grid.rows - 1; row += 1) {
    for (let col = 1; col < grid.cols - 1; col += 1) {
      setWalkable(grid, row, col, walkable)
    }
  }
}

function addBorderWalls(grid: MazeGrid) {
  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      const isBorder = row === 0 || row === grid.rows - 1 || col === 0 || col === grid.cols - 1
      if (isBorder) setWalkable(grid, row, col, false)
    }
  }
}

function finalizeMarkers(grid: MazeGrid) {
  for (const cell of grid.cells) {
    cell.start = cell.id === grid.startId
    cell.goal = cell.id === grid.goalId
    if (cell.start || cell.goal) cell.walkable = true
  }
}

function getCell(grid: MazeGrid, row: number, col: number) {
  return grid.cells.find((entry) => entry.row === row && entry.col === col)
}

function hasPathToGoal(grid: MazeGrid) {
  const visited = new Set<string>([grid.startId])
  const queue = [grid.startId]

  while (queue.length > 0) {
    const currentId = queue.shift()
    if (!currentId) break
    if (currentId === grid.goalId) return true

    const current = grid.cells.find((entry) => entry.id === currentId)
    if (!current) continue

    const neighbors = [
      [current.row - 1, current.col],
      [current.row + 1, current.col],
      [current.row, current.col - 1],
      [current.row, current.col + 1],
    ]

    for (const [nextRow, nextCol] of neighbors) {
      const neighbor = getCell(grid, nextRow, nextCol)
      if (!neighbor?.walkable || visited.has(neighbor.id)) continue
      visited.add(neighbor.id)
      queue.push(neighbor.id)
    }
  }

  return false
}

function carveGuaranteedRoute(grid: MazeGrid) {
  const [startRow, startCol] = grid.startId.split('-').map(Number)
  const [goalRow, goalCol] = grid.goalId.split('-').map(Number)
  const midRow = Math.max(1, Math.min(grid.rows - 2, Math.floor(grid.rows / 2)))
  const midCol = Math.max(1, Math.min(grid.cols - 2, Math.floor(grid.cols / 2)))

  for (let col = Math.min(startCol, midCol); col <= Math.max(startCol, midCol); col += 1) {
    setWalkable(grid, startRow, col, true)
  }

  for (let row = Math.min(startRow, midRow); row <= Math.max(startRow, midRow); row += 1) {
    setWalkable(grid, row, midCol, true)
  }

  for (let col = Math.min(midCol, goalCol); col <= Math.max(midCol, goalCol); col += 1) {
    setWalkable(grid, midRow, col, true)
  }

  for (let row = Math.min(midRow, goalRow); row <= Math.max(midRow, goalRow); row += 1) {
    setWalkable(grid, row, goalCol, true)
  }
}

function applyClassicPattern(grid: MazeGrid) {
  setEndpoints(grid, 1, 1, grid.rows - 2, grid.cols - 2)
  fillInnerArea(grid, false)
  const random = createSeededRandom(grid.rows * 100 + grid.cols * 17)
  const stack: Array<[number, number]> = [[1, 1]]
  const carved = new Set<string>(['1-1'])
  const directions: Array<[number, number]> = [
    [-2, 0],
    [2, 0],
    [0, -2],
    [0, 2],
  ]

  setWalkable(grid, 1, 1, true)

  while (stack.length > 0) {
    const [row, col] = stack[stack.length - 1]
    const shuffled = [...directions].sort(() => random() - 0.5)
    const next = shuffled.find(([dr, dc]) => {
      const nextRow = row + dr
      const nextCol = col + dc
      const inside = nextRow > 0 && nextRow < grid.rows - 1 && nextCol > 0 && nextCol < grid.cols - 1
      return inside && !carved.has(`${nextRow}-${nextCol}`)
    })

    if (!next) {
      stack.pop()
      continue
    }

    const [dr, dc] = next
    const nextRow = row + dr
    const nextCol = col + dc
    const wallRow = row + dr / 2
    const wallCol = col + dc / 2

    setWalkable(grid, wallRow, wallCol, true)
    setWalkable(grid, nextRow, nextCol, true)
    carved.add(`${nextRow}-${nextCol}`)
    stack.push([nextRow, nextCol])
  }

}

function applyOpenPattern(grid: MazeGrid) {
  setEndpoints(grid, 1, 1, grid.rows - 2, grid.cols - 2)
  clearInnerArea(grid)
  for (let row = 2; row < grid.rows - 2; row += 4) {
    for (let col = 2; col < grid.cols - 2; col += 4) {
      if ((row + col) % 3 === 0) setWalkable(grid, row, col, false)
    }
  }
}

function applyCorridorPattern(grid: MazeGrid) {
  setEndpoints(grid, 1, 1, grid.rows - 2, grid.cols - 2)
  fillInnerArea(grid, false)

  for (let row = 1; row < grid.rows - 1; row += 2) {
    const leftToRight = ((row - 1) / 2) % 2 === 0
    const cols = leftToRight
      ? Array.from({ length: grid.cols - 2 }, (_, index) => index + 1)
      : Array.from({ length: grid.cols - 2 }, (_, index) => grid.cols - 2 - index)

    for (const col of cols) setWalkable(grid, row, col, true)

    if (row < grid.rows - 2) {
      setWalkable(grid, row + 1, leftToRight ? grid.cols - 2 : 1, true)
    }
  }
}

function applyBranchingPattern(grid: MazeGrid) {
  setEndpoints(grid, grid.rows - 2, 1, grid.rows - 2, grid.cols - 2)
  fillInnerArea(grid, false)

  for (let col = 1; col < grid.cols - 1; col += 1) {
    setWalkable(grid, grid.rows - 2, col, true)
  }

  for (let row = 1; row < grid.rows - 1; row += 1) {
    setWalkable(grid, row, 1, true)
  }

  for (let row = 2; row < grid.rows - 2; row += 3) {
    const branchEnd = Math.min(grid.cols - 4, 2 + row)
    for (let col = 1; col <= branchEnd; col += 1) {
      setWalkable(grid, row, col, true)
    }
  }

  for (let row = 1; row < grid.rows - 2; row += 2) {
    setWalkable(grid, row, 2, true)
  }
}

function applyDeadEndPattern(grid: MazeGrid) {
  setEndpoints(grid, 1, 1, grid.rows - 2, grid.cols - 2)
  fillInnerArea(grid, false)

  for (let col = 1; col < grid.cols - 1; col += 1) {
    setWalkable(grid, 1, col, true)
  }

  for (let row = 1; row < grid.rows - 1; row += 1) {
    setWalkable(grid, row, grid.cols - 2, true)
  }

  for (let col = 3; col < grid.cols - 2; col += 2) {
    const branchLength = Math.max(2, Math.min(grid.rows - 4, col))
    for (let row = 1; row <= branchLength; row += 1) {
      setWalkable(grid, row, col, true)
    }
  }

  for (let row = 3; row < grid.rows - 2; row += 3) {
    setWalkable(grid, row, grid.cols - 3, true)
    setWalkable(grid, row, grid.cols - 4, true)
  }
}

export function buildMazeGrid(rows: number, cols: number, pattern: MazePattern): MazeGrid {
  const grid = createEmptyGrid(rows, cols, pattern)
  addBorderWalls(grid)

  switch (pattern) {
    case 'classic':
      applyClassicPattern(grid)
      break
    case 'open':
      applyOpenPattern(grid)
      break
    case 'corridor':
      applyCorridorPattern(grid)
      break
    case 'branching':
      applyBranchingPattern(grid)
      break
    case 'dead-ends':
      applyDeadEndPattern(grid)
      break
  }

  finalizeMarkers(grid)
  if (!hasPathToGoal(grid)) {
    carveGuaranteedRoute(grid)
    finalizeMarkers(grid)
  }
  return grid
}
