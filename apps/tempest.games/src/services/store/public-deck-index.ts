import * as AtomIO from "atom.io"
import { getJsonToken } from "atom.io/internal"

import {
	cardGroupIndex,
	findCardGroupState,
	ownersOfGroups,
} from "~/apps/node/lodge/src/store/game"

export const publicDeckIndex = AtomIO.selector<string[]>({
	key: `publicDeckIndex`,
	get: ({ get }) => {
		const cardGroupIds = get(getJsonToken(cardGroupIndex))
		console.log(`cardGroupIds`, cardGroupIds)
		const unownedCardGroupIds = cardGroupIds.members.filter(
			(cardGroupId) =>
				get(ownersOfGroups.findState.playerKeyOfGroup(cardGroupId)) === null && // ❗
				get(findCardGroupState(cardGroupId)).type === `deck`,
		)
		console.log(`unownedCardGroupIds`, unownedCardGroupIds)
		return unownedCardGroupIds
	},
})
