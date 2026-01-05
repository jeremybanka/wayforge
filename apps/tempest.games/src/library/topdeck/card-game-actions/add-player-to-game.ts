import { transaction } from "atom.io"

// export const addPlayerToGameTX = transaction<(playerId: string) => void>({
// 	key: `addPlayerToGame`,
// 	do: (transactors, playerId) => {
// 		const { set } = transactors

// 		set(gamePlayerKeysAtom, (current) => {
// 			return [...current, playerId]
// 		})
// 	},
// })
