import { transaction } from "atom.io"
import { usersInThisRoomIndex } from "atom.io/realtime"

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
	handIds: HandKey[]
	trickId: TrickKey
	deckId: DeckKey
	cardIds: CardKey[]
	txId: string
	shuffle: number
}
export const startGameTX = transaction<(input: StartGameInput) => void>({
	key: `startGame`,
	do: (transactors, { handIds, trickId, deckId, cardIds, txId, shuffle }) => {
		const { get, set, run, json } = transactors
		run(spawnClassicDeckTX, `${txId}:spawnDeck`)(deckId, cardIds)
		const { members } = get(json(usersInThisRoomIndex))
		set(gamePlayerIndex, members)
		let i = 0
		for (const playerId of members) {
			run(spawnHandTX, `${txId}:spawnHand:${playerId}`)(playerId, handIds[i])
			i++
		}
		run(spawnTrickTX, `${txId}:spawnTrick`)(trickId)
		run(shuffleDeckTX, `${txId}:shuffle`)(deckId, shuffle)
		i = 52
		const remainingCardCount = 52 % members.length
		while (i > remainingCardCount) {
			const handIdx = i % members.length
			const handId = handIds[handIdx]
			run(dealCardsTX, `${txId}:deal:${i}`)(deckId, handId, 1)
			i--
		}
	},
})
