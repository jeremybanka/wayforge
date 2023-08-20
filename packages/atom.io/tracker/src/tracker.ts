import * as AtomIO from "atom.io"

import { observeCore, updateCore } from "./tracker-effects"
import type { Transceiver } from "./tracker-transceiver"

export const tracker = <Core extends Transceiver<any>>(
	coreState: AtomIO.AtomToken<Core>,
	store: AtomIO.__INTERNAL__.Store = AtomIO.__INTERNAL__.IMPLICIT.STORE,
): AtomIO.AtomToken<
	(Core extends Transceiver<infer Signal> ? Signal : never) | null
> => {
	const trackerKey = `${coreState.key}:signal`
	const trackerState = AtomIO.atom<
		(Core extends Transceiver<infer Signal> ? Signal : never) | null
	>({
		key: trackerKey,
		default: null,
		effects: [
			observeCore(coreState, store),
			updateCore(trackerKey, coreState, store),
		],
	})
	return trackerState
}
