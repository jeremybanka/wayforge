import { IActionRequest } from "../src/core/actions/types"
import installHeartsActions from "../src/plugin/hearts"
import createGame from "../src/store/game"

describe(`hearts actions`, () => {
  let g
  let make
  beforeEach(() => {
    const game = createGame()
    installHeartsActions(game)
    g = () => game.getState()
    make = (request: IActionRequest) => g().dispatch(request)
    const addPlayers = (x:number) => {
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
    console.log(`# of players`, g().getPlayers().length)
  })
  describe(`INIT`, () => {
    it(``, () => {
      // console.log(g().actions)
      const request = {
        type: `INIT`,
        payload: { },
      }
      make(request)
      console.log(g().cardGroupsById)
    })
  })
})
