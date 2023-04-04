import { pipe } from "fp-ts/function"
import { ReplaySubject, filter, take } from "rxjs"
import { Server as WebSocketServer } from "socket.io"
import { io } from "socket.io-client"
import { vitest } from "vitest"

import type { GameClientSocket } from "../src/socket-interface"
import { serveGame } from "../src/socket-interface"
import {
  configureActions,
  initGame,
  useActions,
  useDispatch,
} from "../src/store"
import { ID } from "../test/test-utils"

it(`adds a player`, () => {
  const game = pipe(initGame(), useActions, useDispatch)
  game.dispatch(`ADD_PLAYER`, { id: `A`, options: { id: `player1` } })
  expect(game.store.getState().players[`player1`]).toBeDefined()
})

const PORT = 2060

vitest.spyOn(console, `info`)

const createClientId = ID.style_$_000000()
const createServerId = ID.style_000000_$()

beforeAll(
  () =>
    pipe(
      new WebSocketServer(PORT),
      serveGame({
        logger: console,
        game: pipe(
          initGame(),
          configureActions({ idFn: createServerId }),
          useDispatch
        ),
      })
    ).close
)

describe(`game server usage`, () => {
  const client: GameClientSocket = io(`http://localhost:${PORT}/`)

  const clientSubject = new ReplaySubject<GameClientSocket | undefined>(1)
  clientSubject.next(undefined)
  const useClient = (fn: (client: GameClientSocket | undefined) => void) =>
    clientSubject
      .pipe(
        filter((client) => client !== undefined),
        take(1)
      )
      .subscribe(fn)
  client.on(`connect`, () => {
    clientSubject.next(client)
  })

  beforeEach(client.removeAllListeners)

  test(
    `ACTION:ADD_PLAYER`,
    async () =>
      new Promise<void>((pass, fail) =>
        client.on(`connect`, () =>
          client
            .on(`ACTION:ADD_PLAYER`, (result) => {
              try {
                expect(console.info).toHaveBeenCalledWith(
                  client.id,
                  `ACTION:ADD_PLAYER`,
                  { id: `A`, options: { id: client.id } }
                )
                expect(result).toEqual({
                  // id: `A`,
                  players: {
                    [client.id]: {},
                  },
                })
              } catch (caught) {
                fail(caught)
              }
              pass()
            })
            .emit(`ACTION:ADD_PLAYER`, { id: `A`, options: { id: client.id } })
        )
      ),
    1000
  )
})
