import type { KeyedStateUpdate, StateUpdate } from "atom.io"

import type { Atom } from ".."
import { newest } from "../lineage"
import { isTransceiver } from "../mutable"
import type { Store } from "../store"

function shouldUpdateBeStowed(key: string, update: StateUpdate<any>): boolean {
	// do not stow updates that aren't json
	if (isTransceiver(update.newValue)) {
		return false
	}
	// do not stow updates where the key contains 👁‍🗨
	if (key.includes(`👁‍🗨`)) {
		return false
	}
	return true
}

export const stowUpdate = <T>(
	state: Atom<T>,
	update: StateUpdate<T>,
	store: Store,
): void => {
	const { key } = state
	const target = newest(store)
	if (
		target.transactionMeta === null ||
		target.transactionMeta.phase !== `building`
	) {
		store.logger.error(
			`🐞`,
			`atom`,
			key,
			`stowUpdate called outside of a transaction. This is probably a bug.`,
		)
		return
	}
	const shouldStow = shouldUpdateBeStowed(key, update)
	if (!shouldStow) {
		return
	}
	const atomUpdate: KeyedStateUpdate<T> = { key, ...update }
	if (state.family) {
		atomUpdate.family = state.family
	}
	target.transactionMeta.update.updates.push(atomUpdate)
	store.logger.info(
		`📁`,
		`atom`,
		key,
		`stowed (`,
		update.oldValue,
		`->`,
		update.newValue,
		`)`,
	)
}
