import * as fs from "fs"

import { pipe } from "fp-ts/function"
import { Server as WebSocketServer } from "socket.io"
import { io } from "socket.io-client"
import { vitest } from "vitest"

import { redact } from "~/packages/Anvil/src/object"
import { ensureAgainst } from "~/packages/Anvil/src/refinement"
import { setupLab } from "~/script/lab-tools"

import { isGitSocketError, serveSimpleGit } from "./git-io.node"
import type { GitClientSocket } from "./git-io.web"

const PORT = 2451

vitest.spyOn(console, `info`)

const $_LOG_$ = <T>(value: T): T => (console.log(value), value)

beforeAll(() => setupLab().disposeLab)

beforeAll(
  () =>
    pipe(
      new WebSocketServer(PORT),
      serveSimpleGit({ logger: console, baseDir: `../wayforge-lab` })
    ).close
)

describe(`git-io usage`, () => {
  const client: GitClientSocket = io(`http://localhost:${PORT}/`)

  beforeEach(client.removeAllListeners)

  it(`fails to report status before initialization`, async () =>
    new Promise<void>((pass, fail) =>
      client
        .on(`status`, (result) => {
          try {
            expect(console.info).toHaveBeenCalledWith(client.id, `status`)
            expect(isGitSocketError(result))
          } catch (thrown) {
            fail(thrown)
          }
          pass()
        })
        .emit(`status`)
    ))

  it(`initializes git`, async () =>
    new Promise<void>((pass, fail) =>
      client
        .on(`init`, (result) => {
          try {
            expect(console.info).toHaveBeenCalledWith(client.id, `init`)
            expect(
              pipe(
                result,
                ensureAgainst(isGitSocketError),
                redact(`gitDir` /* this is local to runner's machine */)
              )
            ).toStrictEqual({
              bare: false,
              existing: false,
              path: `../wayforge-lab`,
            })
          } catch (thrown) {
            fail(thrown)
          }
          pass()
        })
        .emit(`init`)
    ))

  it(`reports clean status`, async () =>
    new Promise<void>((pass, fail) =>
      client
        .on(`status`, (result) => {
          try {
            expect(console.info).toHaveBeenCalledWith(client.id, `status`)
            expect(result).toStrictEqual({
              current: `main`,
              tracking: null,
              detached: false,
              ahead: 0,
              behind: 0,
              created: [],
              deleted: [],
              modified: [],
              conflicted: [],
              files: [],
              not_added: [],
              renamed: [],
              staged: [],
            })
          } catch (thrown) {
            fail(thrown)
          }
          pass()
        })
        .emit(`status`)
    ))

  it(`reports dirty status`, async () =>
    new Promise<void>((pass, fail) => {
      fs.writeFileSync(`../wayforge-lab/README.md`, `# Hello, World!`)
      client
        .on(`status`, (result) => {
          try {
            expect(console.info).toHaveBeenCalledWith(client.id, `status`)
            expect(result).toStrictEqual({
              current: `main`,
              tracking: null,
              detached: false,
              ahead: 0,
              behind: 0,
              created: [],
              deleted: [],
              modified: [],
              conflicted: [],
              files: [
                {
                  path: `README.md`,
                  index: `?`,
                  working_dir: `?`,
                },
              ],
              not_added: [`README.md`],
              renamed: [],
              staged: [],
            })
          } catch (thrown) {
            fail(thrown)
          }
          pass()
        })
        .emit(`status`)
    }))

  it(`adds file`, async () =>
    new Promise<void>((pass, fail) =>
      client
        .on(`add`, (result) => {
          try {
            expect(console.info).toHaveBeenCalledWith(client.id, `add`)
            expect(
              pipe(
                result,
                ensureAgainst(isGitSocketError),
                redact(`gitDir` /* this is local to runner's machine */)
              )
            ).toStrictEqual({
              path: `../wayforge-lab`,
              files: [`README.md`],
            })
          } catch (thrown) {
            fail(thrown)
          }
          pass()
        })
        .emit(`add`, `README.md`)
    ))

  it(`reports diff`, async () =>
    new Promise<void>((pass, fail) => {
      client
        .on(`diff`, (result) => {
          try {
            expect(console.info).toHaveBeenCalledWith(client.id, `diff`)
            expect(result).toStrictEqual(``)
          } catch (thrown) {
            fail(thrown)
          }
          pass()
        })
        .emit(`diff`)
    }))
})
