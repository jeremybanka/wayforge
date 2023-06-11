import type { DrawCorner } from "corners"
import corners, { chamfer, straight, writePathPoint } from "corners"

export type Interpolate = (
  from: number,
  to: number,
  completionRatio?: number
) => number

export const interpolate: Interpolate = (from, to, completionRatio = 0.5) =>
  from + completionRatio * (to - from)

export const ForwardDiagonal = corners(chamfer, null).size(5)
export const CurledLeft = corners(null, null, chamfer, null).size(5)

export const auspice: DrawCorner = (p1, p2, idx) => {
  const isEven = idx % 2 === 0
  const axis1 = isEven ? `x` : `y`
  const axis2 = isEven ? `y` : `x`

  const l0 = {
    [axis1]: interpolate(p1[axis1], p2[axis1], 0.5),
    [axis2]: p1[axis2],
  }
  const l1 = {
    [axis1]: interpolate(p1[axis1], p2[axis1], 0.5),
    [axis2]: interpolate(p1[axis2], p2[axis2], 0.5),
  }

  const l2 = {
    [axis1]: p2[axis1],
    [axis2]: interpolate(p1[axis2], p2[axis2], 0.5),
  }

  return [
    writePathPoint(p1.x, p1.y, idx === 0 ? `M` : `L`),

    isEven ? writePathPoint(l1.x, l1.y) : writePathPoint(l0.x, l0.y),
    isEven ? writePathPoint(l2.x, l2.y) : writePathPoint(l1.x, l1.y),
    writePathPoint(p2.x, p2.y),
  ]
}
export const Auspicious = corners(auspice, null).size(200)

export const wedge: DrawCorner = (p1, p2, idx) => {
  if (idx === 0) {
    return [writePathPoint(p1.x - (p2.x - p1.x), p1.y, `M`)]
  }
  return straight(p1, p2, idx)
}
export const Wedged = corners(wedge, null, null, null).size(2000)
