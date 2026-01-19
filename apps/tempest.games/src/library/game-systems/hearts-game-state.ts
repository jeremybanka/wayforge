import { atom, transaction } from "atom.io"
import { usersHereSelector } from "atom.io/realtime-client"

import {
	createClassicDeckTX,
	createHandTX,
	dealTX,
	shuffleDeckTX,
	spawnTrickTX,
} from "./card-game-actions"
import type { CardKey, HandKey } from "./card-game-stores"
import { playerTurnOrderAtom } from "./game-setup-turn-order-and-spectators"

export type HeartsPublicGameState<PlayerId extends string = string> = {
	leftoverCardCount: number
	heartsHasBeenBroken: boolean
	playerOrder: PlayerId[]
	trickContributionsPerPlayer: Record<PlayerId, CardKey[]>
	pointsPerPlayer: Record<PlayerId, number>
	trickCountPerPlayer: Record<PlayerId, number>
}

export type HeartsPublicLastTurnOutcome<PlayerId extends string = string> = {
	winner: PlayerId
	trick: CardKey[]
}
export const heartsPublicLastTurnOutcomeState =
	atom<HeartsPublicLastTurnOutcome | null>({
		key: `heartsPublicLastTurnOutcome`,
		default: null,
	})

export type HeartsPrivateGameState = {
	cardsInMyHand: CardKey[]
}

export type HeartsPrivateStrategy = {
	iDecidedToShootTheMoonThisGame: boolean
	myThoughtsOnTheGame: string
}

export type HeartsPublicAdvancedStrategy = {
	cardsNotYetPlayed: CardKey[]
}

export type HeartsGameSummary = {
	situationalOverview: string
	myHandSummary: string
	trickSummary: string
	opponentSummaries: string[]
	thoughtsOnTheGameLastTurn: string
	lastTurnOutcome: string
}

export type HeartsGameResponse = {
	briefThoughtsOnTheGame: string
	chosenCard: CardKey
	iAmDecidingToShootTheMoonRightNow?: true
}

export type StartGameInput = {
	shuffle: number
}
export const startGameTX = transaction<(input: StartGameInput) => void>({
	key: `startGame`,
	do: (transactors, { shuffle }) => {
		const { get, set, run } = transactors
		const deckKey = run(createClassicDeckTX)()
		const userKeys = get(usersHereSelector)
		if (!userKeys) throw new Error(`Not in a room`)
		set(playerTurnOrderAtom, (prev) => {
			for (const playerId of userKeys) {
				prev.push(playerId)
			}
			return prev
		})
		const handKeys: HandKey[] = []
		const createHand = run(createHandTX)
		for (const userKey of userKeys) {
			const handKey = createHand(userKey)
			handKeys.push(handKey)
		}
		run(spawnTrickTX)()
		run(shuffleDeckTX)(deckKey, shuffle)
		let i = 52
		const remainingCardCount = 52 % userKeys.size
		const deal = run(dealTX)
		while (i > remainingCardCount) {
			const handIdx = i % handKeys.length
			const handId = handKeys[handIdx]
			deal(deckKey, handId)
			--i
		}
	},
})
