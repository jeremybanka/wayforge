/* eslint-disable no-restricted-syntax */
enum ranks {
  rankA = `A`,
  rank2 = `2`,
  rank3 = `3`,
  rank4 = `4`,
  rank5 = `5`,
  rank6 = `6`,
  rank7 = `7`,
  rank8 = `8`,
  rank9 = `9`,
  rank10= `10`,
  rankJ = `J`,
  rankQ = `Q`,
  rankK = `K`,
}

enum suits {
  Spades = `Spades`,
  Clubs = `Clubs`,
  Diamonds = `Diamonds`,
  Hearts = `Hearts`,
}

export class PlayingCard {
  rank: ranks

  suit: suits

  constructor(rank:string, suit:string) {
    this.rank = rank as ranks
    this.suit = suit as suits
  }
}

type Enum = Record<string, string>

export const generatePlayingCardDeck
= (ranks:Enum, suits:Enum)
: PlayingCard[] => {
  const playingCards: PlayingCard[] = []
  for (const s in suits) {
    if (Object.prototype.hasOwnProperty.call(suits, s)) {
      const suit = suits[s]
      for (const r in ranks) {
        if (Object.prototype.hasOwnProperty.call(ranks, r)) {
          const rank = ranks[r]
          playingCards.push(new PlayingCard(rank, suit))
        }
      }
    }
  }
  return playingCards
}

export const frenchPlayingCardDeck = generatePlayingCardDeck(ranks, suits)
