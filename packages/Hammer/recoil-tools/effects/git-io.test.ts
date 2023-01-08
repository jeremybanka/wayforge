import { Server as WebSocketServer } from "socket.io"
import { io } from "socket.io-client"
import { vitest } from "vitest"

import { serveSimpleGit } from "./git-io.node"
import type { GitClientSocket } from "./git-io.web"

// mock console with vitest

vitest.spyOn(console, `info`)

beforeAll(() => {
  const server = new WebSocketServer(3333)
  serveSimpleGit({ logger: console })(server)
})

describe(`git-io`, () => {
  it(`should work hit the server`, async () => {
    const socket: GitClientSocket = io(`http://localhost:3333/`)
    socket.emit(`status`)
    expect(console.info).toHaveBeenCalledWith(`status`)
  })
})
