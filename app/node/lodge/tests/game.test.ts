import installCoreActions from "../src/core/actions"
import { IActionRequest } from "../src/core/actions/types"
import { CardGroup, CardValue } from "../src/core/models"
import { frenchPlayingCardDeck } from "../src/plugin/PlayingCard"
import createGame from "../src/store/game"

const { entries, values } = Object
const zeroth = <T> (obj:Record<string, T>): T => values(obj)[0]
const tallyOf =  (obj:Record<string, unknown>): number => entries(obj).length

describe(`Core Actions`, () => {
  let g
  let make
  beforeEach(() => {
    const game = createGame()
    installCoreActions(game)
    g = () => game.getState()
    make = (request: IActionRequest) => g().dispatch(request)
  })

  describe(`CLEAR_TABLE`, () => {
    it(`will clear out everything but the players and card values`, () => {
      const request: IActionRequest = {
        type: `CLEAR_TABLE`,
        payload: {},
      }
      make(request)
      let tally = 0
      const shouldBeEmpty = [
        `cardsById`,
        `cardCyclesById`,
        `cardGroupsById`,
        `zonesById`,
        `zoneLayoutsById`,
      ]
      shouldBeEmpty.forEach(holder => {
        tally += tallyOf(g()[holder])
      })
      expect(tally).toBe(0)
    })
  })

  describe(`CREATE_PLAYER`, () => {
    it(`creates a player`, () => {
      const request: IActionRequest = {
        type: `CREATE_PLAYER`,
        payload: { options: { userId: 1, socketId: `foo` } },
      }
      make(request)
      const { playersById } = g()
      expect(tallyOf(playersById)).toBe(1)
      expect(g().playerIdsBySocketId.foo).toBe(g().playerIdsByUserId[1])
    })
  })

  describe(`CREATE_DECK`, () => {
    it(`creates an empty deck`, () => {
      const request: IActionRequest = {
        type: `CREATE_DECK`,
        payload: { targets: { cardValueIds: [] } },
      }
      make(request)
      const { cardGroupsById } = g()
      expect(tallyOf(cardGroupsById)).toBe(1)
    })
    it(`creates a standard deck of cards`, () => {
      const request1: IActionRequest = {
        type: `CREATE_CARD_VALUES`,
        payload: { options: { values: frenchPlayingCardDeck } },
      }
      make(request1)
      const { cardValuesById } = g()
      const cardValues: CardValue[] = Object.values(cardValuesById)
      const cardValueIds = cardValues.map(val => val.id)
      const request2: IActionRequest = {
        type: `CREATE_DECK`,
        payload: { targets: { cardValueIds } },
      }
      make(request2)
      const { cardGroupsById } = g()
      expect(tallyOf(cardGroupsById)).toBe(1)
      expect(zeroth<CardGroup>(cardGroupsById).cardIds.length).toBe(52)
    })
  })

  describe(`LOAD`, () => {
    it(`loads new CardValues`, () => {
      const request: IActionRequest = {
        type: `CREATE_CARD_VALUES`,
        payload: { options: { values: frenchPlayingCardDeck } },
      }
      make(request)
      const { cardValuesById } = g()
      expect(tallyOf(cardValuesById)).toBe(52)
    })
  })

  // describe(`SHUFFLE`, () => {
  //   it(`changes the order of a deck`, () => {
  //     const request1: IActionRequest = {
  //       type: `LOAD`,
  //       payload: { options: { values: frenchPlayingCardDeck } },
  //     }
  //     const request2: IActionRequest = {
  //       type: `LOAD`,
  //       payload: { options: { values: frenchPlayingCardDeck } },
  //     }
  //     make(request1)
  //     make(request2)
  //     const { cardValuesById } = g()
  //     expect(tallyOf(cardValuesById)).toBe(52)
  //   })
  // })
})

// describe(`generate playing card deck`, () => {
//   it(`generates a deck`, () => {
//     console.log(frenchPlayingCardDeck)
//   })
// })
