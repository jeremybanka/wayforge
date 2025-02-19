import { transaction } from "atom.io"
import { type Actual, usersInThisRoomIndex } from "atom.io/realtime"
import type { UserKey } from "atom.io/realtime-server"

import { dealCardsTX } from "../card-game-actions/deal-cards"
import { shuffleDeckTX } from "../card-game-actions/shuffle-deck"
import { spawnClassicDeckTX } from "../card-game-actions/spawn-classic-deck"
import { spawnHandTX } from "../card-game-actions/spawn-hand"
import { spawnTrickTX } from "../card-game-actions/spawn-trick"
import type { DeckKey, HandKey } from "../card-game-stores/card-groups-store"
import type { CardKey } from "../card-game-stores/cards-store"
import { gamePlayerIndex } from "../card-game-stores/game-players-store"
import type { TrickKey } from "../card-game-stores/trick-store"

export type StartGameInput = {
	handKeys: HandKey[]
	trickKey: TrickKey
	deckKey: DeckKey
	cardKeys: CardKey[]
	txId: string
	shuffle: number
}
export const startGameTX = transaction<
	(userKey: UserKey<Actual>, input: StartGameInput) => void
>({
	key: `startGame`,
	do: (
		transactors,
		userKey,
		{ handKeys, trickKey, deckKey, cardKeys, txId, shuffle },
	) => {
		const { get, set, run, json } = transactors
		run(spawnClassicDeckTX, `${txId}:spawnDeck`)(userKey, deckKey, cardKeys)
		const { members } = get(json(usersInThisRoomIndex))
		set(gamePlayerIndex, members)
		let i = 0
		for (const playerId of members) {
			run(spawnHandTX, `${txId}:spawnHand:${playerId}`)(playerId, handKeys[i])
			i++
		}
		run(spawnTrickTX, `${txId}:spawnTrick`)(userKey, trickKey)
		run(shuffleDeckTX, `${txId}:shuffle`)(userKey, deckKey, shuffle)
		i = 52
		const remainingCardCount = 52 % members.length
		while (i > remainingCardCount) {
			const handIdx = i % members.length
			const handId = handKeys[handIdx]
			run(dealCardsTX, `${txId}:deal:${i}`)(userKey, deckKey, handId, 1)
			i--
		}
	},
})
