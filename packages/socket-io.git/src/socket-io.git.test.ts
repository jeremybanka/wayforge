import * as fs from "fs"

import { pipe } from "fp-ts/function"
import git from "simple-git"
import { Server as WebSocketServer } from "socket.io"
import { io } from "socket.io-client"
import { vitest } from "vitest"

import { redact } from "~/packages/anvl/src/object"
import { ensureAgainst } from "~/packages/anvl/src/refinement"
import { setupLab } from "~/util/lab-tools"

import { isGitSocketError } from "./core"
import { serveSimpleGit } from "./socket-io-git.node"
import type { GitClientSocket } from "./socket-io-git.web"

const PORT = 2451

vitest.spyOn(console, `info`)

beforeAll(() => setupLab().disposeLab)

beforeAll(
  () =>
    pipe(
      new WebSocketServer(PORT),
      serveSimpleGit({
        logger: console,
        git: git({ baseDir: `../../../wayforge-lab` }),
      })
    ).close
)

describe(`git-io usage`, () => {
  const client: GitClientSocket = io(`http://localhost:${PORT}/`)

  beforeEach(client.removeAllListeners)

  it(`fails to report status before initialization`, () => {
    client
      .on(`status`, (result) => {
        expect(console.info).toHaveBeenCalledWith(client.id, `status`)
        expect(isGitSocketError(result))
      })
      .emit(`status`)
  })

  it(`initializes git`, () => {
    client
      .on(`init`, (result) => {
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
          path: `../../../wayforge-lab`,
        })
      })
      .emit(`init`)
  })

  it(`reports clean status`, () => {
    client
      .on(`status`, (result) => {
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
      })
      .emit(`status`)
  })

  it(`reports dirty status`, () => {
    fs.writeFileSync(`../../../wayforge-lab/README.md`, `# Hello, World!`)
    client
      .on(`status`, (result) => {
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
      })
      .emit(`status`)
  })

  it(`adds file`, () => {
    client
      .on(`add`, (result) => {
        expect(console.info).toHaveBeenCalledWith(client.id, `add`, `README.md`)
        expect(pipe(result, ensureAgainst(isGitSocketError))).toStrictEqual(``)
      })
      .emit(`add`, `README.md`)
  })

  it(`commits file`, () => {
    client
      .on(`commit`, (result) => {
        expect(console.info).toHaveBeenCalledWith(
          client.id,
          `commit`,
          `📝 Add README.md`
        )
        expect(
          pipe(
            result,
            ensureAgainst(isGitSocketError),
            redact(`commit` /* this is timing-based */)
          )
        ).toStrictEqual({
          author: null,
          branch: `main`,
          root: true,
          summary: {
            changes: 1,
            deletions: 0,
            insertions: 1,
          },
        })
      })
      .emit(`commit`, `📝 Add README.md`)
  })

  it(`reports diff`, async () => {
    client
      .on(`diff`, (result) => {
        expect(console.info).toHaveBeenCalledWith(client.id, `diff`)
        expect(result).toStrictEqual(``)
      })
      .emit(`diff`)
  })
})
