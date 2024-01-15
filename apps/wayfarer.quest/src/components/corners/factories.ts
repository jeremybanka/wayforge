import type { DrawCorner } from "corners"
import corners, { chamfer, interpolate, straight, writePathPoint } from "corners"

export const ForwardDiagonal5 = corners(chamfer, null).size(5)
export const BackwardDiagonal10 = corners(null, chamfer).size(10)
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
export const Auspicious0 = corners(auspice).size(200)
export const Auspicious1 = corners(auspice, null).size(200)
export const Auspicious2 = corners(null, auspice).size(200)
export const Auspicious3 = corners(auspice, null, null, null).size(200)
export const Auspicious4 = corners(null, null, auspice, null).size(200)
export const Auspicious5 = corners(null, auspice, null, null).size(200)
export const Auspicious6 = corners(null, null, null, auspice).size(200)

export const wedge0: DrawCorner = (p1, p2, idx) => {
	if (idx === 0) {
		return [writePathPoint(p1.x - (p2.x - p1.x), p1.y, `M`)]
	}
	return straight(p1, p2, idx)
}
export const wedge3: DrawCorner = (p1, p2, idx) => {
	if (idx === 3) {
		return [writePathPoint((p1.x + (p2.x - p1.x)) * 2, p2.y, `L`)]
	}
	return straight(p1, p2, idx)
}
export const Wedged0 = corners(wedge0, null, null, null).size(2000)
export const Trapezoid0 = corners(wedge0, null, null, wedge3).size(2000)

export const ChamferedTop = corners(chamfer, null, null, chamfer).size(40)
