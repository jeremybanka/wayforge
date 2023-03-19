import type { IActionRequest } from "../src/core/actions/types"
import installHeartsActions from "../src/plugin/hearts"
import { createGame } from "../src/store/game"

describe(`hearts actions`, () => {
  describe(`INIT`, () => {
    it(`starts the game`, () => {
      const game = installHeartsActions(createGame())
      // console.log(game.getState().cardGroupsById)
      // console.log(game.getState())
      // console.log(game.getState().dispatch)
      const make = (request: IActionRequest) => game.getState().dispatch(request)
      const addPlayers = (x: number) => {
        while (x) {
          const eny = Math.random()
          const request: IActionRequest = {
            type: `CREATE_PLAYER`,
            payload: { options: { userId: eny, socketId: `${eny}` } },
          }
          make(request)
          x--
        }
      }
      addPlayers(3)
      console.log(`# of players`, game.getState().getPlayers().length)
      // console.log(g().actions)
      const request = {
        type: `INIT`,
        payload: {},
      } as const
      make(request as unknown as IActionRequest)
    })
  })
})
