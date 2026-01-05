import { getInternalRelations, transaction } from "atom.io"
import { usersInRooms } from "atom.io/realtime"
import { myRoomKeySelector } from "atom.io/realtime-client"

import { playerTurnOrderAtom } from "../../bug-rangers-game-state"
import {
	dealCardsTX,
	shuffleDeckTX,
	spawnClassicDeckTX,
	spawnHandTX,
	spawnTrickTX,
} from "../card-game-actions"

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
		const roomKey = get(myRoomKeySelector)
		if (!roomKey) throw new Error(`No room key`)
		const [usersInRoomsAtoms] = getInternalRelations(usersInRooms, `split`)
		const users = get(usersInRoomsAtoms, roomKey)
		set(playerTurnOrderAtom, (prev) => {
			for (const playerId of users) {
				prev.push(playerId)
			}
			return prev
		})
		let i = 0
		for (const playerId of users) {
			run(spawnHandTX, `${txId}:spawnHand:${playerId}`)(playerId, handIds[i])
			i++
		}
		run(spawnTrickTX, `${txId}:spawnTrick`)(trickId)
		run(shuffleDeckTX, `${txId}:shuffle`)(deckId, shuffle)
		i = 52
		const remainingCardCount = 52 % users.size
		while (i > remainingCardCount) {
			const handIdx = i % users.size
			const handId = handIds[handIdx]
			run(dealCardsTX, `${txId}:deal:${i}`)(deckId, handId, 1)
			i--
		}
	},
})
