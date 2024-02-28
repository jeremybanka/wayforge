import { atom, selector } from "atom.io"
import { playerOrderState } from "../card-game-stores"
import { trickContentsStates } from "../card-game-stores/trick-store"
import type { CardId } from "../playing-card-data"

export type HeartsPublicGameState<PlayerId extends string = string> = {
	leftoverCardCount: number
	heartsHasBeenBroken: boolean
	playerOrder: PlayerId[]
	trickContributionsPerPlayer: Record<PlayerId, CardId[]>
	pointsPerPlayer: Record<PlayerId, number>
	trickCountPerPlayer: Record<PlayerId, number>
}

export type HeartsPublicLastTurnOutcome<PlayerId extends string = string> = {
	winner: PlayerId
	trick: CardId[]
}
export const heartsPublicLastTurnOutcomeState =
	atom<HeartsPublicLastTurnOutcome | null>({
		key: `heartsPublicLastTurnOutcome`,
		default: null,
	})

export type HeartsPrivateGameState = {
	cardsInMyHand: CardId[]
}

export type HeartsPrivateStrategy = {
	iDecidedToShootTheMoonThisGame: boolean
	myThoughtsOnTheGame: string
}

export type HeartsPublicAdvancedStrategy = {
	cardsNotYetPlayed: CardId[]
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
	chosenCard: CardId
	iAmDecidingToShootTheMoonRightNow?: true
}
