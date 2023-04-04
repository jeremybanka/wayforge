import { pipe } from "fp-ts/function"
import { Server as WebSocketServer } from "socket.io"
import { io } from "socket.io-client"
import tmp from "tmp"
import { vitest } from "vitest"

import type { GameClientSocket } from "../src/socket-interface"
import { serveGame } from "../src/socket-interface"
import { initGame, useActions, useDispatch } from "../src/store"

it(`adds a player`, () => {
  const game = pipe(initGame(), useActions, useDispatch)
  game.dispatch(`ADD_PLAYER`, { options: { id: `player1` } })
  expect(game.store.getState().players[`player1`]).toBeDefined()
})

const PORT = 2452

vitest.spyOn(console, `info`)

const tmpDir = tmp.dirSync({ unsafeCleanup: true })
afterAll(tmpDir.removeCallback)

beforeAll(
  () =>
    pipe(
      new WebSocketServer(PORT),
      serveGame({
        logger: console,
        game: pipe(initGame(), useActions, useDispatch),
      })
    ).close
)

describe(`game server usage`, () => {
  const client: GameClientSocket = io(`http://localhost:${PORT}/`)

  beforeEach(client.removeAllListeners)

  it(
    `ADD_PLAYER`,
    async () =>
      new Promise<void>((pass, fail) =>
        client
          .on(`ACTION:ADD_PLAYER`, (result) => {
            try {
              expect(console.info).toHaveBeenCalledWith(
                client.id,
                `ACTION:ADD_PLAYER`,
                { options: { id: `player1` } }
              )
              expect(result).toEqual({
                players: {
                  player1: {},
                },
              })
            } catch (caught) {
              fail(caught)
            }
            pass()
          })
          .emit(`ACTION:ADD_PLAYER`, { options: { id: `player1` } })
      ),
    1000
  )
})
