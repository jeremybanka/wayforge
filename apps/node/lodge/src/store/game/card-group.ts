import { atom, atomFamily, selector } from "atom.io"
import { selectJson } from "atom.io/json"
import { TransceiverSet } from "~/packages/anvl/reactivity"

import { Join } from "~/packages/anvl/src/join"
import { createMutableAtom } from "~/packages/atom.io/mutable/src"

export type CardGroup = {
	type: `deck` | `hand` | `pile` | null
	name: string
	rotation: number
}
export const findCardGroupState = atomFamily<CardGroup, string>({
	key: `findCardGroup`,
	default: () => ({
		type: null,
		name: ``,
		rotation: 0,
	}),
})
export const cardGroupIndex = createMutableAtom<
	TransceiverSet<string>,
	string[]
>({
	key: `cardGroupsIndex::mutable`,
	default: new TransceiverSet<string>(),
	toJson: (set) => [...set],
	fromJson: (array) => new TransceiverSet<string>(array),
})

export const CARD_GROUPS_OF_GAMES = new Join({
	relationType: `1:n`,
})
	.from(`gameId`)
	.to(`cardGroupId`)
export const cardGroupsOfGamesState = atom({
	key: `cardGroupsOfGames`,
	default: CARD_GROUPS_OF_GAMES,
})
export const cardGroupsOfGamesStateJSON = selectJson(
	cardGroupsOfGamesState,
	CARD_GROUPS_OF_GAMES.makeJsonInterface(),
)

export const GROUPS_OF_CARDS = new Join({
	relationType: `1:n`,
})
	.from(`groupId`)
	.to(`cardId`)
export const groupsOfCardsState = atom({
	key: `groupsOfCards`,
	default: GROUPS_OF_CARDS,
})
export const groupsOfCardsStateJSON = selectJson(
	groupsOfCardsState,
	GROUPS_OF_CARDS.makeJsonInterface(),
)

export const OWNERS_OF_GROUPS = new Join({
	relationType: `1:n`,
})
	.from(`playerId`)
	.to(`groupId`)
export const ownersOfGroupsState = atom({
	key: `ownersOfGroups`,
	default: OWNERS_OF_GROUPS,
})
export const ownersOfGroupsStateJSON = selectJson(
	ownersOfGroupsState,
	OWNERS_OF_GROUPS.makeJsonInterface(),
)
