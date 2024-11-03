import type { Actual, Alias } from "atom.io/realtime-server"

import type { CardValueKey } from "./card-game-stores"

export const CARD_RANKS = [
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
export const CARD_SUITS = [`♠`, `♥`, `♦`, `♣`] as const
export const CARD_VALUES = CARD_RANKS.flatMap((rank) =>
	CARD_SUITS.map(
		(suit): CardValue => ({ rank, suit, id: `cardValue::__${rank}${suit}__` }),
	),
)
export type CardRank = (typeof CARD_RANKS)[number]
export type CardSuit = (typeof CARD_SUITS)[number]
export type CardId = `${CardRank}${CardSuit}`
export type CardValue = {
	rank: CardRank
	suit: CardSuit
	id: `cardValue::${Actual<CardId> | Alias<CardId>}`
}
