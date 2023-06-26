import type { RecoilValueReadOnly } from "recoil"
import { atom, selector } from "recoil"
import type { Socket } from "socket.io-client"

import { recordToEntries } from "~/packages/anvl/src/object/entries"
import { capitalize } from "~/packages/anvl/src/string/capitalize"
import type { Transact } from "~/packages/hamr/src/recoil-tools/recoil-transaction-tools"

import { DEFAULT_SIMPLE_GIT_RETURN_VALUES } from "./defaults"
import type {
  GitInterface,
  GitClientEvents,
  GitServerEvents,
  GitSocketError,
} from "./interface"

export * from "./interface"

export type GitClientSocket = Socket<GitServerEvents, GitClientEvents>

export type GitClientTools = {
  [GitFunction in keyof GitInterface]: GitInterface[GitFunction] extends (
    ...args: any[]
  ) => any
    ? {
        (...args: Parameters<GitInterface[GitFunction]>): void
        state: RecoilValueReadOnly<
          Awaited<ReturnType<GitInterface[GitFunction]>> | GitSocketError
        >
        getCurrentState: Transact<
          () => Awaited<ReturnType<GitInterface[GitFunction]>> | GitSocketError
        >
      }
    : never
}

export const initGitClientTools = (socket: GitClientSocket): GitClientTools => {
  const completeInterface = {} as GitClientTools

  const makeClientInterface = (key: keyof GitInterface) => {
    const state_INTERNAL = atom<GitSocketError | any>({
      key: `git${capitalize(key)}_INTERNAL`,
      default: DEFAULT_SIMPLE_GIT_RETURN_VALUES[key],
      effects: [
        ({ setSelf }) => {
          socket.on(key, (result) => {
            setSelf(result)
          })
        },
      ],
    })
    const getInternalState: Transact<() => any> = ({ get }) =>
      get(state_INTERNAL)
    const clientInterface = Object.assign(
      (...args: Parameters<GitInterface[keyof GitInterface]>) =>
        socket.emit(key, ...args),
      {
        state: selector({
          key: `git${capitalize(key)}`,
          get: ({ get }) => get(state_INTERNAL),
        }),
        getCurrentState: getInternalState,
      }
    )
    return clientInterface
  }
  for (const [key] of recordToEntries(DEFAULT_SIMPLE_GIT_RETURN_VALUES)) {
    completeInterface[key] = makeClientInterface(key)
  }
  return completeInterface
}
