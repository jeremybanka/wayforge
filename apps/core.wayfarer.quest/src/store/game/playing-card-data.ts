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
export const CARD_VALUES = CARD_RANKS.flatMap((value) =>
	CARD_SUITS.map((suit) => ({ value, suit, id: value + suit })),
)
