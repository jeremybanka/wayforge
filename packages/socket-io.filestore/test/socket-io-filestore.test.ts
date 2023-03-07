import * as fs from "fs"

import { redact } from "anvl/object"
import { ensureAgainst } from "anvl/refinement"
import { pipe } from "fp-ts/function"
import { Server as WebSocketServer } from "socket.io"
import { io } from "socket.io-client"
import { vitest } from "vitest"

import { setupLab } from "~/util/lab-tools"

import {
  FilestoreSocketServer,
  serveFilestore,
} from "../src/node/socket-filestore-node"
import type { FilestoreClientSocket } from "../src/recoil"

const PORT = 2451

vitest.spyOn(console, `info`)

beforeAll(() => setupLab().disposeLab)

beforeAll(
  () =>
    pipe(
      new WebSocketServer(PORT),
      serveFilestore({
        logger: console,
        baseDir: `../../../../wayforge-lab`,
      })
      // (s) => (console.log(s), s)
    )
  //.close
)

describe(`filestore socket api`, () => {
  const client: FilestoreClientSocket = io(`http://localhost:${PORT}/`)

  beforeEach(client.removeAllListeners)

  it(`fails to read a resource where the type has not been initialized`, () =>
    new Promise<void>((pass, fail) =>
      client
        .on(`error_filestore`, (result) => {
          try {
            expect(console.info).toHaveBeenCalledWith(
              client.id,
              `read`,
              `1`,
              `user`
            )
            expect(result).toEqual(
              `ENOENT: no such file or directory, scandir '../../../../wayforge-lab/user'`
            )
          } catch (caught) {
            fail(caught)
          }
          pass()
        })
        .emit(`read`, { type: `user`, id: `1` })
    ))

  it(`fails to write a resource where the type has not been initialized`, () =>
    new Promise<void>((pass, fail) =>
      client
        .on(`error_filestore`, (result) => {
          try {
            expect(console.info).toHaveBeenCalledWith(
              client.id,
              `write`,
              `1`,
              `user`
            )
            expect(result).toEqual(
              `ENOENT: no such file or directory, scandir '../../../../wayforge-lab/user'`
            )
            console.log({ result })
          } catch (caught) {
            fail(caught)
          }
          pass()
        })
        .emit(`write`, { type: `user`, id: `1`, value: { name: `test` } })
    ))

  it(`initializes a new resource type`, () =>
    new Promise<void>((pass, fail) =>
      client
        .on(`f`, (result) => {
          try {
            expect(console.info).toHaveBeenCalledWith(client.id, `init`, `user`)
            expect(result).toEqual(`ok`)
          } catch (caught) {
            fail(caught)
          }
          pass()
        })
        .emit(`initType`, { type: `user` })
    ))
})
