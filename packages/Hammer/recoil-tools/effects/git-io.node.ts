import type { SimpleGitOptions, StatusResult } from "simple-git"
import { simpleGit } from "simple-git"
import type { Socket, Server as WebSocketServer } from "socket.io"

/* prettier-ignore */
// server "on" / client "emit"
export type GitClientEvents = {
  status: () => void
}

/* prettier-ignore */
// server "emit" / client "on"
export type GitServerEvents = {
  status: (s: StatusResult) => void
}

export type GitServerSideEvents = Record<keyof any, unknown>

type GitSocketServer = WebSocketServer<
  GitClientEvents,
  GitServerEvents,
  GitServerSideEvents
>

const options: Partial<SimpleGitOptions> = {
  baseDir: process.cwd(),
  binary: `git`,
  maxConcurrentProcesses: 6,
  trimmed: false,
}

export type ServeGitOptions = Partial<SimpleGitOptions> & {
  logger: Pick<Console, `error` | `info` | `warn`>
}

export const serveSimpleGit =
  (options: ServeGitOptions) =>
  <YourServer extends WebSocketServer>(
    server: YourServer
  ): GitSocketServer & YourServer =>
    server.on(
      `connection`,
      (
        socket: Socket<GitClientEvents, GitServerEvents, GitServerSideEvents>
      ) => {
        const { logger } = options
        const git = simpleGit(options)
        socket.on(`status`, async () => {
          logger.info(socket.id, `status`)
          try {
            const status = await git.status()
            socket.emit(`status`, status)
          } catch (error) {
            logger.error(error)
          }
        })
      }
    )
