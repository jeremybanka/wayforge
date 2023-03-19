import { PlayingCard } from "./PlayingCard"

describe(`PlayingCard`, () => {
  it(`can be instantiated`, () => {
    const card = new PlayingCard(`1`, `A`, `Ace of Spades`)
    expect(card).toBeInstanceOf(PlayingCard)
  })
})
