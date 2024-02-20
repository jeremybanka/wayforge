import { transaction } from "atom.io"
import { getJsonToken } from "atom.io/internal"
import { usersInThisRoomIndex } from "atom.io/realtime"
import {
	dealCardsTX,
	shuffleDeckTX,
	spawnClassicDeckTX,
	spawnHandTX,
	spawnTrickTX,
} from "../card-game-actions"
import { gamePlayerIndex } from "../card-game-stores"

export type StartGameInput = {
	handIds: string[]
	trickId: string
	deckId: string
	cardIds: string[]
	txId: string
	shuffle: number
}
export const startGameTX = transaction<(input: StartGameInput) => void>({
	key: `startGame`,
	do: (transactors, { handIds, trickId, deckId, cardIds, txId, shuffle }) => {
		const { get, set, run } = transactors
		run(spawnClassicDeckTX, `${txId}:spawnDeck`)(deckId, cardIds)
		const usersInThisRoomJsonIndex = getJsonToken(usersInThisRoomIndex)
		const { members } = get(usersInThisRoomJsonIndex)
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
