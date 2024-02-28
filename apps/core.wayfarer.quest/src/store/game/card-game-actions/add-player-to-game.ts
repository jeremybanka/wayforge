import { transaction } from "atom.io"
import { gamePlayerIndex } from "../card-game-stores"

export const addPlayerToGameTX = transaction<(playerId: string) => void>({
	key: `addPlayerToGame`,
	do: (transactors, playerId) => {
		const { set } = transactors

		set(gamePlayerIndex, (current) => {
			current.push(playerId)
			return current
		})
	},
})
