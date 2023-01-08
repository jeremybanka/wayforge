import { pipe } from "fp-ts/lib/function"
import type { StatusResult } from "simple-git"
import { Server as WebSocketServer } from "socket.io"
import { io } from "socket.io-client"
import { expectTypeOf, vitest } from "vitest"

import { DEFAULT_STATUS_RESULT } from "./git-io"
import { serveSimpleGit } from "./git-io.node"
import type { GitClientSocket } from "./git-io.web"

const PORT = 2451

vitest.spyOn(console, `info`)

beforeAll(
  () =>
    pipe(new WebSocketServer(PORT), serveSimpleGit({ logger: console })).close
)

describe(`git-io`, () => {
  it(`should get status from the server`, async () =>
    new Promise<void>((done, reject) => {
      const socket: GitClientSocket = io(`http://localhost:${PORT}/`)
      socket.emit(`status`)
      socket.on(`status`, (status) => {
        expect(console.info).toHaveBeenCalledWith(socket.id, `status`)
        expectTypeOf(status).toEqualTypeOf<StatusResult>(DEFAULT_STATUS_RESULT)
        done()
      })
    }))
})
