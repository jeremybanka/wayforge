import { inspect } from "node:util"

import type { TimelineToken } from "atom.io"
import { IMPLICIT, withdraw } from "atom.io/internal"

export function inspectTimeline(tl: TimelineToken<any>): void {
	const tlInternal = withdraw(IMPLICIT.STORE, tl)
	console.log(
		`at ${tlInternal.at}`,
		inspect(tlInternal.history, {
			colors: true,
			depth: null,
		}),
	)
}
