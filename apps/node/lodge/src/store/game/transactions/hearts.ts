import { transaction } from "atom.io"
import { playersInRooms } from "../../rooms"
import { dealCardsTX } from "./deal-cards"
import { shuffleDeckTX } from "./shuffle-deck"
import { spawnClassicDeckTX } from "./spawn-classic-deck"
import { spawnHandTX } from "./spawn-hand"
import { spawnTrickTX } from "./spawn-trick"

export type StartGameInput = {
	gameId: string
	handIds: string[]
	trickId: string
	deckId: string
	cardIds: string[]
	txId: string
	shuffle: number
}
export const startGameTX = transaction<(input: StartGameInput) => void>({
	key: `startGame`,
	do: (
		transactors,
		{ gameId, handIds, trickId, deckId, cardIds, txId, shuffle },
	) => {
		const { find, get, run } = transactors
		run(spawnClassicDeckTX, `${txId}:spawnDeck`)(gameId, deckId, cardIds)
		const playerIds = get(find(playersInRooms.states.playerKeysOfRoom, gameId))
		let i = 0
		for (const playerId of playerIds) {
			run(spawnHandTX, `${txId}:spawnHand:${playerId}`)(playerId, handIds[i])
			i++
		}
		run(spawnTrickTX, `${txId}:spawnTrick`)(gameId, trickId)
		run(shuffleDeckTX, `${txId}:shuffle`)(gameId, deckId, shuffle)
		i = 52
		const remainingCardCount = 52 % playerIds.length
		while (i > remainingCardCount) {
			const handIdx = i % playerIds.length
			const handId = handIds[handIdx]
			run(dealCardsTX, `${txId}:deal:${i}`)(gameId, deckId, handId, 1)
			i--
		}
	},
})
