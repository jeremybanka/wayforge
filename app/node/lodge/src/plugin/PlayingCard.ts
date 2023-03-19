import { recordToEntries } from "~/packages/anvl/src/object"

import type { Deck } from "../core/models"

const RANKS: unique symbol = Symbol()
const SUITS: unique symbol = Symbol()

type PlayingCardRanks = Readonly<Record<string, string>> // & { [RANKS]: true }>
type PlayingCardSuits = Readonly<Record<string, string>> // & { [SUITS]: true }>
type RankFrom<Ranks extends PlayingCardRanks> = keyof Ranks
type SuitFrom<Suits extends PlayingCardSuits> = keyof Suits

const FRENCH_PLAYING_CARD_RANKS: PlayingCardRanks = {
  // [RANKS]: true,
  "A": `Ace`,
  "2": `Two`,
  "3": `Three`,
  "4": `Four`,
  "5": `Five`,
  "6": `Six`,
  "7": `Seven`,
  "8": `Eight`,
  "9": `Nine`,
  "10": `Ten`,
  "J": `Jack`,
  "Q": `Queen`,
  "K": `King`,
} as const
type FrenchPlayingCardRank = RankFrom<typeof FRENCH_PLAYING_CARD_RANKS>

const FRENCH_PLAYING_CARD_SUITS: PlayingCardSuits = {
  // [SUITS]: true,
  "♣": `Clubs`,
  "♦": `Diamonds`,
  "♥": `Hearts`,
  "♠": `Spades`,
} as const
type FrenchPlayingCardSuit = keyof typeof FRENCH_PLAYING_CARD_SUITS

export class PlayingCard<
  Ranks extends PlayingCardRanks,
  Suits extends PlayingCardSuits
> {
  public rank: RankFrom<Ranks>
  public suit: SuitFrom<Suits>
  public name: string
  public constructor(
    rank: RankFrom<Ranks>,
    suit: SuitFrom<Suits>,
    name: string
  ) {
    this.rank = rank
    this.suit = suit
    this.name = name
  }
}

export const generatePlayingCardDeck = <
  Ranks extends PlayingCardRanks,
  Suits extends PlayingCardSuits
>({
  ranks,
  suits,
}: {
  ranks: Ranks
  suits: Suits
}): PlayingCard<Ranks, Suits>[] => {
  const playingCards: PlayingCard<Ranks, Suits>[] = []
  const suitEntries = recordToEntries(suits)
  const rankEntries = recordToEntries(ranks)
  for (const [rank, rankName] of rankEntries) {
    for (const [suit, suitName] of suitEntries) {
      playingCards.push(
        new PlayingCard(rank, suit, `${rankName} of ${suitName}`)
      )
    }
  }
  return playingCards
}

export const frenchPlayingCardDeck = generatePlayingCardDeck({
  ranks: FRENCH_PLAYING_CARD_RANKS,
  suits: FRENCH_PLAYING_CARD_SUITS,
})

// const initPlayingCards = <
//   Suits extends PlayingCardSuits,
//   Ranks extends PlayingCardRanks
// >({
//   ranks,
//   suits,
// }: {
//   ranks: Ranks
//   suits: Suits
// }): {
//   createDeck: () => PlayingCard<Suits, Ranks>[]
//   isPlayingCard: (input: unknown) => input is PlayingCard<Suits, Ranks>
// } => {
//   const createDeck: Deck

//   const
// isPlayingCard = (input: unknown): input is PlayingCard<Suits, Ranks> =>
//     input instanceof PlayingCard

//   return { createDeck, isPlayingCard }
// }
