import type { AtomTokenIndex, SelectorTokenIndex } from "./meta-state"
import { attachMetaAtoms, attachMetaSelectors } from "./meta-state"
import type { ReadonlySelectorToken } from "../.."
import type { Store } from "../store"
import { IMPLICIT } from "../store"

export const attachMetaState = (
	store: Store = IMPLICIT.STORE,
): {
	atomTokenIndexState: ReadonlySelectorToken<AtomTokenIndex>
	selectorTokenIndexState: ReadonlySelectorToken<SelectorTokenIndex>
} => {
	return {
		atomTokenIndexState: attachMetaAtoms(store),
		selectorTokenIndexState: attachMetaSelectors(store),
	}
}
