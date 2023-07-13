import type { Filter, Degree } from "~/packages/Luum/src"

import { wrapAround } from "../utils"

export default (hue: Degree, filter: Filter): number => {
	// 430
	let maxSat = 255
	const hueWrapped = wrapAround(hue, [0, 360]) // 70
	for (let a = -1, b = 0; b < filter.length; a++, b++) {
		a = wrapAround(a, [0, filter.length])
		// console.log('||| a =', a, 'b =', b)
		const hueDoubleWrapped =
			a > b ? wrapAround(hueWrapped, [-180, 180]) : undefined // undef
		const tuningPointA = filter[a]
		const tuningPointB = filter[b]
		const hueA =
			a > b ? wrapAround(tuningPointA.hue, [-180, 180]) : tuningPointA.hue
		const hueB = tuningPointB.hue
		if (
			(hueDoubleWrapped || hueWrapped) >= hueA &&
			(hueDoubleWrapped || hueWrapped) < hueB
		) {
			// console.log(
			//   '||| hue', hue, 'between', tuningPointA.hue, 'and', tuningPointB.hue
			// )
			let $ = hueDoubleWrapped || hueWrapped // 70
			$ -= hueA // 70 - 50 = 20 //
			$ /= hueB - hueA // 20 / (120 - 50) = 2/7
			$ *= tuningPointB.sat - tuningPointA.sat // -128 * 2 / 7 = -256 / 7 ~= -37
			$ += tuningPointA.sat
			Math.round($)
			// console.log('||| _', _)
			maxSat = $
		}
	}
	// console.log('--- maxSat', maxSat)
	return maxSat
}
