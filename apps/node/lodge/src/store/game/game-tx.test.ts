import { TransceiverSet } from "~/packages/anvl/reactivity"
import { getState, runTransaction, setLogLevel } from "~/packages/atom.io/src"
import { findCardGroupState, groupsOfCards } from "./card-group"
import { addHandTx, dealCardsTX, spawnClassicDeckTX } from "./game-tx"

// setLogLevel(`info`)

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
			count: 1,
		})
		console.log(
			getState(groupsOfCards.findRelationsState__INTERNAL(`myHand`)).size,
		)
		console.log(
			getState(groupsOfCards.findRelationsState__INTERNAL(`deckId`)).size,
		)
		runTransaction(dealCardsTX)({
			deckId: `deckId`,
			handId: `myHand`,
			count: 1,
		})
		console.log(
			getState(groupsOfCards.findRelationsState__INTERNAL(`myHand`)).size,
		)
		console.log(
			getState(groupsOfCards.findRelationsState__INTERNAL(`deckId`)).size,
		)
		expect(
			getState(groupsOfCards.findRelationsState__INTERNAL(`myHand`)),
		).toEqual(new TransceiverSet([`C51`, `C50`]))
		expect(
			getState(groupsOfCards.findRelationsState__INTERNAL(`deckId`)),
		).toEqual(new TransceiverSet(Array.from({ length: 50 }, (_, k) => `C${k}`)))
	})
})
