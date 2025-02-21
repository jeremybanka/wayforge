import type { WritableToken } from "atom.io"
import type { Store } from "atom.io/internal"
import { initFamilyMemberInStore, setIntoStore } from "atom.io/internal"
import { parseJson } from "atom.io/json"

export function upsertState<T>(
	store: Store,
	continuityKey: string,
	token: WritableToken<T>,
	value: T,
): void {
	if (token.family) {
		const family = store.families.get(token.family.key)
		if (family) {
			const molecule = store.molecules.get(token.family.subKey)
			if (!molecule && store.config.lifespan === `immortal`) {
				store.logger.error(
					`❌`,
					`continuity`,
					continuityKey,
					`No molecule found for key "${token.family.subKey}"`,
				)
				return
			}
			initFamilyMemberInStore(store, family, parseJson(token.family.subKey))
		}
	}
	setIntoStore(store, token, value)
}
