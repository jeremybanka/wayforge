import * as AtomIO from "atom.io"

import {
	cardGroupIndex,
	findCardGroupState,
	ownersOfGroups,
} from "~/apps/node/lodge/src/store/game"

export const publicDeckIndex = AtomIO.selector<string[]>({
	key: `publicDeckIndex`,
	get: ({ get }) => {
		const cardGroupIds = get(cardGroupIndex)

		const unownedCardGroupIds = [...cardGroupIds].filter(
			(cardGroupId) =>
				get(ownersOfGroups.findState.playerKeyOfGroup(cardGroupId)) ===
					undefined && // ❗
				get(findCardGroupState(cardGroupId)).type === `deck`,
		)
		return unownedCardGroupIds
	},
})
