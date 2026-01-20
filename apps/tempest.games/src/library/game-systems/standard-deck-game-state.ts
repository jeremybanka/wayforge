import { atomFamily } from "atom.io"

import type { CardKey } from "./card-game-state"

export const PLAYING_CARD_RANKS = [
	`2`,
	`3`,
	`4`,
	`5`,
	`6`,
	`7`,
	`8`,
	`9`,
	`10`,
	`J`,
	`Q`,
	`K`,
	`A`,
] as const
export const PLAYING_CARD_SUITS = [`♠`, `♥`, `♦`, `♣`] as const
export const PLAYING_CARD_VALUES = PLAYING_CARD_RANKS.flatMap((rank) =>
	PLAYING_CARD_SUITS.map((suit): PlayingCardValue => ({ rank, suit })),
)
export type PlayingCardRank = (typeof PLAYING_CARD_RANKS)[number]
export type PlayingCardSuit = (typeof PLAYING_CARD_SUITS)[number]
export type PlayingCardName = `${PlayingCardRank}${PlayingCardSuit}`
export type PlayingCardValue = {
	rank: PlayingCardRank
	suit: PlayingCardSuit
}

export const playingCardValueAtoms = atomFamily<PlayingCardValue, CardKey>({
	key: `playingCardValue`,
	default: {
		rank: `2`,
		suit: `♠`,
	},
})
