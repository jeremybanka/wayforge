import { isString } from "fp-ts/string"
import type {
  SimpleGitOptions,
  SimpleGit,
  SimpleGitTaskCallback,
} from "simple-git"
import { simpleGit } from "simple-git"
import type { Socket, Server as WebSocketServer } from "socket.io"

import type { ErrorObject } from "~/packages/Anvil/src/json/json-api"
import { hasProperties } from "~/packages/Anvil/src/object"

type RequireAllInTuple<T extends any[]> = T extends [a?: infer A]
  ? [a: A]
  : T extends [a?: infer A, b?: infer B]
  ? [a: A, b: B]
  : T extends [a?: infer A, b?: infer B, c?: infer C]
  ? [a: A, b: B, c: C]
  : T extends [a?: infer A, b?: infer B, c?: infer C, d?: infer D]
  ? [a: A, b: B, c: C, d: D]
  : never

type RequireAllParams<T extends (...args: any[]) => any> = (
  ...args: RequireAllInTuple<Parameters<T>>
) => ReturnType<T>

type TupleA = [hello: boolean]
type TupleLengthA = TupleA[`length`]
type TupleRequiredA = RequireAllInTuple<TupleA>
type TupleB = [name: string, hello?: boolean]
type TupleLengthB = TupleB[`length`]
type TupleRequiredB = RequireAllInTuple<TupleB>

type MyFn = (name: string, hello?: boolean) => void
type MyFnRequired = RequireAllParams<MyFn>

export type PopIf<Array extends any[], Problematic> = Array extends [
  ...infer Others,
  infer _
]
  ? _ extends Problematic
    ? Others
    : Array
  : never

export type PopCallback<T extends any[]> = PopIf<T, (...args: any[]) => any>

export type FunctionWithoutFinalCallback<
  T extends (...args: ReadonlyArray<any>) => any
> = (...args: PopCallback<Parameters<RequireAllParams<T>>>) => ReturnType<T>

const exFnA = (...args: [string, number, boolean]) => args
const exFnB = (a: string, b: number, c: boolean, d: () => void) => a
const exFnC = (a: string, b?: () => void) => a
const exFnD = (a?: string, b?: () => void) => a

type ExFnA = FunctionWithoutFinalCallback<typeof exFnA>
type ExFnB = FunctionWithoutFinalCallback<typeof exFnB>
type ExFnC = FunctionWithoutFinalCallback<typeof exFnC>
type ExFnD = FunctionWithoutFinalCallback<typeof exFnD>

const exFnA2: ExFnA = (a, b, c) => [a, b, c]
const exFnB2: ExFnB = (a, b, c) => a
const exFnC2: ExFnC = (a) => a
const exFnD2: ExFnD = (a) => a

// type AddOriginal = (files: string | string[],
// callback?: types.SimpleGitTaskCallback<string>): Response<string>
type AddModified = FunctionWithoutFinalCallback<SimpleGit[`add`]>

export type GitSocketError = ErrorObject<`title`>

export const isGitSocketError = (value: unknown): value is GitSocketError =>
  hasProperties({
    type: (a: unknown): a is `error` => `error` === a,
    title: isString,
  })(value)

/* prettier-ignore */
// server "on" / client "emit"
export type GitClientEvents = {
  [GitFunction in keyof SimpleGit]: 
    FunctionWithoutFinalCallback<SimpleGit[GitFunction]>
}

export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

/* prettier-ignore */
// server "emit" / client "on"
export type GitServerEvents = {
  [GitFunction in keyof SimpleGit]: 
    SimpleGit[GitFunction] extends (...args: any[]) => any 
      ? (
        result: 
          | GitSocketError
          | UnwrapPromise<ReturnType<SimpleGit[GitFunction]>>
      ) => void 
      : never
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

        const handle: Partial<GitClientEvents> = {
          status: async () => {
            logger.info(socket.id, `status`)
            try {
              const result = await git.status()
              socket.emit(`status`, result)
            } catch (thrown) {
              if (thrown instanceof Error) {
                logger.error(thrown.message)
                socket.emit(`status`, {
                  type: `error`,
                  title: thrown.message,
                })
              } else {
                throw thrown
              }
            }
          },
          init: async () => {
            logger.info(socket.id, `init`)
            try {
              const result = await git.init()
              socket.emit(`init`, result)
            } catch (thrown) {
              if (thrown instanceof Error) {
                logger.error(thrown.message)
                socket.emit(`init`, {
                  type: `error`,
                  title: thrown.message,
                })
              } else {
                throw thrown
              }
            }
          },
          diff: async () => {
            logger.info(socket.id, `diff`)
            try {
              const result = await git.diff()
              socket.emit(`diff`, result)
            } catch (thrown) {
              if (thrown instanceof Error) {
                logger.error(thrown.message)
                socket.emit(`diff`, {
                  type: `error`,
                  title: thrown.message,
                })
              } else {
                throw thrown
              }
            }
          },
          add: async (...args) => {
            logger.info(socket.id, `add`, args)
            try {
              const result = await git.add(...args)
              socket.emit(`add`, result)
            } catch (thrown) {
              if (thrown instanceof Error) {
                logger.error(thrown.message)
                socket.emit(`add`, {
                  type: `error`,
                  title: thrown.message,
                })
              } else {
                throw thrown
              }
            }
          },
        }

        socket.on(`init`, handle.init)
        socket.on(`diff`, handle.diff)
        socket.on(`status`, handle.status)
      }
    )
