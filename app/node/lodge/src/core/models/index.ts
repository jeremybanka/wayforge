export * from './Card'
export * from './CardCycle'
export * from './CardGroup'
export * from './CardValue'
export * from './Player'
export * from './Zone'
export * from './ZoneLayout'
export * from './types'

/*
Card
  Methods:
    discard()
    play()

Player
  Methods:
    drawFrom(deck)
      -> deck.draw(taker)

Pools (nonlinear cardgroups)

Stacks (linear cardgroups)
  Deck
    All cards hidden
    Example: Action Deck, Environment Deck
    Methods:
      draw()
      deal(dealer, taker)
      mill()
      view()
      reveal()
      shuffle()
  Hand
    All cards private
    Belongs to a deck
    Methods:
      discard()
      reveal()
      shuffle()
      mill()
  Pile
    First card public, rest hidden

Structure ()
  Spread
    All cards public
  Grid

*/
