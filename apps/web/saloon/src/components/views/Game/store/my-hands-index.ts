import * as AtomIO from "atom.io"
import { myIdState } from "atom.io/realtime-react"

import {
	findCardGroupState,
	ownersOfGroupsState,
} from "~/apps/node/lodge/src/store/game"

export const myHandsIndex = AtomIO.selector<string[]>({
	key: `myHands`,
	get: ({ get }) => {
		const myId = get(myIdState)
		if (!myId) {
			return []
		}
		const ownersOfGroups = get(ownersOfGroupsState)
		const myGroups = ownersOfGroups.getRelatedIds(myId)
		const myHands = myGroups.filter(
			(id) => get(findCardGroupState(id)).type === `hand`,
		)
		return myHands
	},
})
