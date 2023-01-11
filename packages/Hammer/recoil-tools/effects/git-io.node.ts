import { pipe } from "fp-ts/function"
import { isString } from "fp-ts/string"
import type { SimpleGitOptions, SimpleGit } from "simple-git"
import { simpleGit } from "simple-git"
import type { Socket, Server as WebSocketServer } from "socket.io"

import type { Encapsulate } from "~/packages/Anvil/src/function"
import type { ErrorObject } from "~/packages/Anvil/src/json/json-api"
import {
  hasProperties,
  recordToEntries,
  redact,
} from "~/packages/Anvil/src/object"

export const SIMPLE_GIT_FUNCTIONS_INACCESSIBLE_OVER_SOCKET = [
  `clearQueue`,
  `customBinary`,
  `env`,
  `silent`,
  `outputHandler`,
] as const

export type GitInterface = Omit<
  SimpleGit,
  typeof SIMPLE_GIT_FUNCTIONS_INACCESSIBLE_OVER_SOCKET[number]
>

export type GitSocketError = ErrorObject<`title`>

export const isGitSocketError = (value: unknown): value is GitSocketError =>
  hasProperties({
    type: (a: unknown): a is `error` => `error` === a,
    title: isString,
  })(value)

/* prettier-ignore */
// server "on" / client "emit"
export type GitClientEvents = {
  [GitFunction in keyof GitInterface]: Encapsulate<GitInterface[GitFunction]>
}

export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

/* prettier-ignore */
// server "emit" / client "on"
export type GitServerEvents = {
  [GitFunction in keyof GitInterface]: 
  GitInterface[GitFunction] extends (...args: any[]) => any 
      ? (
        result: 
          | GitSocketError
          | UnwrapPromise<ReturnType<GitInterface[GitFunction]>>
      ) => void 
      : never
}

export type GitServerSideEvents = Record<keyof any, unknown>

type GitSocketServer = WebSocketServer<
  GitClientEvents,
  GitServerEvents,
  GitServerSideEvents
>

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

        const git = pipe(
          simpleGit(options),
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
