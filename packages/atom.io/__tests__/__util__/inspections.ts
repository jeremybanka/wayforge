import { inspect } from "node:util"

import type { TimelineToken } from "atom.io"
import { IMPLICIT, withdraw } from "atom.io/internal"

export function inspectTimeline(tl: TimelineToken<any>): void {
	const tlInternal = withdraw(IMPLICIT.STORE, tl)
	console.log(`at ${tlInternal.at}/${tlInternal.history.length}:`)
	let i = 0
	for (const event of tlInternal.history) {
		console.log(`${i}-------------------------------------------------${i}`)
		console.log(
			inspect(event, {
				colors: true,
				depth: null,
			}),
		)
		++i
	}
}
