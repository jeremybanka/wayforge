import { getState, runTransaction, setLogLevel } from "~/packages/atom.io/src"
import { findCardGroupState, groupsOfCards } from "./card-group"
import { addHandTx, dealCardsTX, spawnClassicDeckTX } from "./game-tx"

setLogLevel(`info`)

describe(`dealCardsTX`, () => {
	it(`should deal cards`, () => {
		runTransaction(spawnClassicDeckTX)(
			`deckId`,
			Array.from({ length: 52 }, (_, k) => `C${k}`),
		)
		runTransaction(addHandTx)({ playerId: `me`, groupId: `myHand` })
		runTransaction(dealCardsTX)({
			deckId: `deckId`,
			handId: `myHand`,
			count: 52,
		})
	})
})
