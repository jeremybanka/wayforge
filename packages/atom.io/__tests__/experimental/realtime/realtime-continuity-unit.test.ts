import type { AtomToken } from "atom.io"
import { atomFamily } from "atom.io"
import { IMPLICIT } from "atom.io/internal"
import { useConcealState, useRevealState } from "atom.io/realtime-client"

atomFamily<number, string>({
	key: `count`,
	default: 0,
})

test(`revealState`, () => {
	expect(IMPLICIT.STORE.valueMap.size).toBe(5)
	const revealState = useRevealState(IMPLICIT.STORE)
	const concealState = useConcealState(IMPLICIT.STORE)

	const tokens = Array.from({ length: 10 }).map(
		(_, i): AtomToken<number, string> => ({
			type: `atom`,
			key: `count("${i}")`,
			family: { key: `count`, subKey: `"${i}"` },
		}),
	)
	revealState(tokens.flatMap((token) => [token, Math.random()]))
	expect(IMPLICIT.STORE.valueMap.size).toBe(15)

	concealState(tokens)
	expect(IMPLICIT.STORE.valueMap.size).toBe(5)
})
