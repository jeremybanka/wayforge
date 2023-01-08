import type { SimpleGitOptions } from "simple-git"
import { simpleGit } from "simple-git"
import type { Socket, Server as WebSocketServer } from "socket.io"
import type { EventsMap } from "socket.io/dist/typed-events"

/* prettier-ignore */
export type GitListenEvents = {
  status: () => void
}
/* end-prettier-ignore */

export interface GitEmitEvents extends EventsMap {
  indexRead: ({ type }: { type: string }) => void
}

export interface GitServerSideEvents extends EventsMap {
  indexRead: ({ type }: { type: string }) => void
}

type GitSocketServer = WebSocketServer<
  GitListenEvents,
  GitEmitEvents,
  GitServerSideEvents
>

const options: Partial<SimpleGitOptions> = {
  baseDir: process.cwd(),
  binary: `git`,
  maxConcurrentProcesses: 6,
  trimmed: false,
}

export type ServeGitOptions = Partial<SimpleGitOptions> & {
  logger: Pick<Console, `debug` | `error` | `info` | `trace` | `warn`>
}

export const serveSimpleGit =
  (options: ServeGitOptions) =>
  <YourServer extends WebSocketServer>(
    server: YourServer
  ): GitSocketServer & YourServer =>
    server.on(
      `connection`,
      (socket: Socket<GitListenEvents, GitEmitEvents, GitServerSideEvents>) => {
        const { logger } = options
        const git = simpleGit(options)
        socket.on(`status`, async () => {
          try {
            const status = await git.status()
            socket.emit(`status`, status)
          } catch (error) {
            logger.error(error)
          }
        })
      }
    )
