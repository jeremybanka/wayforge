import { pipe } from "fp-ts/function"
import type { SimpleGit, SimpleGitOptions } from "simple-git"
import { simpleGit } from "simple-git"
import type { Socket, Server as WebSocketServer } from "socket.io"

import { redact } from "~/packages/anvl/src/object"
import { recordToEntries } from "~/packages/anvl/src/object/entries"

import type {
  GitClientEvents,
  GitInterface,
  GitServerEvents,
  GitServerSideEvents,
} from "./interface"
import { SIMPLE_GIT_FUNCTIONS_INACCESSIBLE_OVER_SOCKET } from "./interface"

export * from "./interface"

type GitSocketServer = WebSocketServer<
  GitClientEvents,
  GitServerEvents,
  GitServerSideEvents
>

export type ServeGitOptions = {
  logger: Pick<Console, `error` | `info` | `warn`>
  git?: SimpleGit
}

export const serveSimpleGit =
  (options: ServeGitOptions) =>
  <YourServer extends WebSocketServer>(
    server: YourServer
  ): GitSocketServer & YourServer => (
    options.logger.info(`init`, `git-io`),
    server.on(
      `connection`,
      (
        socket: Socket<GitClientEvents, GitServerEvents, GitServerSideEvents>
      ) => {
        const { logger } = options

        const git = pipe(
          options.git ?? simpleGit(),
          redact(...SIMPLE_GIT_FUNCTIONS_INACCESSIBLE_OVER_SOCKET)
        )

        const makeHandler =
          (key: keyof GitInterface) =>
          async (...args: any[]) => {
            logger.info(socket.id, key, ...args)
            try {
              const result = await (git[key] as (...args: any[]) => any)(...args)
              socket.emit(key, result)
            } catch (thrown) {
              if (thrown instanceof Error) {
                logger.error(thrown.message)
                socket.emit(key, {
                  type: `error`,
                  title: thrown.message,
                })
              } else {
                throw thrown
              }
            }
          }

        const handle: GitClientEvents = {
          add: makeHandler(`add`),
          addAnnotatedTag: makeHandler(`addAnnotatedTag`),
          addConfig: makeHandler(`addConfig`),
          addRemote: makeHandler(`addRemote`),
          addTag: makeHandler(`addTag`),
          applyPatch: makeHandler(`applyPatch`),
          binaryCatFile: makeHandler(`binaryCatFile`),
          branch: makeHandler(`branch`),
          branchLocal: makeHandler(`branchLocal`),
          catFile: makeHandler(`catFile`),
          checkIgnore: makeHandler(`checkIgnore`),
          checkIsRepo: makeHandler(`checkIsRepo`),
          checkout: makeHandler(`checkout`),
          checkoutBranch: makeHandler(`checkoutBranch`),
          checkoutLatestTag: makeHandler(`checkoutLatestTag`),
          checkoutLocalBranch: makeHandler(`checkoutLocalBranch`),
          clean: makeHandler(`clean`),
          clone: makeHandler(`clone`),
          commit: makeHandler(`commit`),
          cwd: makeHandler(`cwd`),
          deleteLocalBranch: makeHandler(`deleteLocalBranch`),
          deleteLocalBranches: makeHandler(`deleteLocalBranches`),
          diff: makeHandler(`diff`),
          diffSummary: makeHandler(`diffSummary`),
          exec: makeHandler(`exec`),
          fetch: makeHandler(`fetch`),
          getConfig: makeHandler(`getConfig`),
          getRemotes: makeHandler(`getRemotes`),
          grep: makeHandler(`grep`),
          hashObject: makeHandler(`hashObject`),
          init: makeHandler(`init`),
          listConfig: makeHandler(`listConfig`),
          listRemote: makeHandler(`listRemote`),
          log: makeHandler(`log`),
          merge: makeHandler(`merge`),
          mergeFromTo: makeHandler(`mergeFromTo`),
          mirror: makeHandler(`mirror`),
          mv: makeHandler(`mv`),
          pull: makeHandler(`pull`),
          push: makeHandler(`push`),
          pushTags: makeHandler(`pushTags`),
          raw: makeHandler(`raw`),
          rebase: makeHandler(`rebase`),
          remote: makeHandler(`remote`),
          removeRemote: makeHandler(`removeRemote`),
          reset: makeHandler(`reset`),
          revert: makeHandler(`revert`),
          revparse: makeHandler(`revparse`),
          rm: makeHandler(`rm`),
          rmKeepLocal: makeHandler(`rmKeepLocal`),
          show: makeHandler(`show`),
          stash: makeHandler(`stash`),
          stashList: makeHandler(`stashList`),
          status: makeHandler(`status`),
          subModule: makeHandler(`subModule`),
          submoduleAdd: makeHandler(`submoduleAdd`),
          submoduleInit: makeHandler(`submoduleInit`),
          submoduleUpdate: makeHandler(`submoduleUpdate`),
          tag: makeHandler(`tag`),
          tags: makeHandler(`tags`),
          updateServerInfo: makeHandler(`updateServerInfo`),
          version: makeHandler(`version`),
        }

        for (const [key, fn] of recordToEntries(handle)) {
          socket.on(key, fn)
        }
      }
    )
  )
