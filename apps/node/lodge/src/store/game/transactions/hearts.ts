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
}
export const startGameTX = transaction<(input: StartGameInput) => void>({
	key: `startGame`,
	do: (transactors, { gameId, handIds, trickId, deckId, cardIds }) => {
		const { find, get, run } = transactors
		run(spawnClassicDeckTX)(gameId, deckId, cardIds)
		const playerIds = get(find(playersInRooms.states.playerKeysOfRoom, gameId))
		let i = 0
		for (const playerId of playerIds) {
			run(spawnHandTX)(playerId, handIds[i])
			i++
		}
		run(spawnTrickTX)(gameId, trickId)
		run(shuffleDeckTX)(gameId, deckId)
		i = 52
		while (i > playerIds.length) {
			const handIdx = i % playerIds.length
			const handId = handIds[handIdx]
			run(dealCardsTX)(gameId, deckId, handId, 1)
			i--
		}
	},
})
