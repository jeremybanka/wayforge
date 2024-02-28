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
	CARD_SUITS.map((suit): CardValue => ({ rank, suit, id: `${rank}${suit}` })),
)
export type CardRank = (typeof CARD_RANKS)[number]
export type CardSuit = (typeof CARD_SUITS)[number]
export type CardId = `${CardRank}${CardSuit}`
export type CardValue = { rank: CardRank; suit: CardSuit; id: CardId }
