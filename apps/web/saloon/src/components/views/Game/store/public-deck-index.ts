import * as AtomIO from "atom.io"

import {
	cardGroupIndex,
	findCardGroupState,
	ownersOfGroupsState,
} from "~/apps/node/lodge/src/store/game"

export const publicDeckIndex = AtomIO.selector<string[]>({
	key: `publicDeckIndex`,
	get: ({ get }) => {
		const ownersOfGroups = get(ownersOfGroupsState)
		const cardGroupIds = get(cardGroupIndex)

		const unownedCardGroupIds = [...cardGroupIds].filter(
			(cardGroupId) =>
				ownersOfGroups.getRelatedId(cardGroupId) === undefined &&
				get(findCardGroupState(cardGroupId)).type === `deck`,
		)
		return unownedCardGroupIds
	},
})
