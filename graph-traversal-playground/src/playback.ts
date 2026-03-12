export interface PlaybackSnapshot<TFrame> {
  frame: TFrame
  index: number
  total: number
  isFirst: boolean
  isLast: boolean
}

function clampIndex(index: number, total: number) {
  if (total <= 0) return 0
  return Math.max(0, Math.min(index, total - 1))
}

export function getPlaybackSnapshot<TFrame>(frames: TFrame[], index: number): PlaybackSnapshot<TFrame> | null {
  if (frames.length === 0) return null
  const safeIndex = clampIndex(index, frames.length)
  return {
    frame: frames[safeIndex],
    index: safeIndex,
    total: frames.length,
    isFirst: safeIndex === 0,
    isLast: safeIndex === frames.length - 1,
  }
}

export function nextPlaybackIndex(index: number, total: number) {
  return clampIndex(index + 1, total)
}

export function previousPlaybackIndex(index: number, total: number) {
  return clampIndex(index - 1, total)
}
