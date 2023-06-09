import type { DrawCorner } from "corners"
import corners, { chamfer, writePathPoint } from "corners"

export const ForwardDiagonal = corners(chamfer, null).size(5)
export const CurledLeft = corners(null, null, chamfer, null).size(5)

export const auspice: DrawCorner = (p1, p2, idx) => {
  const idxEven = idx % 2 === 0
  const a = idxEven ? `x` : `y`
  const b = idxEven ? `y` : `x`
  return [
    writePathPoint(p1.x, p1.y, idx === 0 ? `M` : `L`),
    writePathPoint(p2.x, p2.y, `L`),
  ]
}
