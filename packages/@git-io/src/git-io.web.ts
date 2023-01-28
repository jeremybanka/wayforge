import type { RecoilValueReadOnly } from "recoil"
import { atom, selector } from "recoil"
import type { Socket } from "socket.io-client"

import { recordToEntries } from "~/packages/anvl/src/object"

import type {
  GitInterface,
  GitClientEvents,
  GitServerEvents,
  GitSocketError,
} from "./git-io"
import { DEFAULT_SIMPLE_GIT_RETURN_VALUES } from "./static/defaults"

export type GitClientSocket = Socket<GitServerEvents, GitClientEvents>

export type GitClientTools = {
  [GitFunction in keyof GitInterface]: GitInterface[GitFunction] extends (
    ...args: any[]
  ) => any
    ? {
        state: RecoilValueReadOnly<
          Awaited<ReturnType<GitInterface[GitFunction]>> | GitSocketError
        >
        action: (...args: Parameters<GitInterface[GitFunction]>) => void
      }
    : never
}

export const capitalize = (str: string): string =>
  str[0].toUpperCase() + str.slice(1)

export const initGitClientTools = (socket: GitClientSocket): GitClientTools => {
  const completeInterface = {} as GitClientTools

  const makeClientInterface = (key: keyof GitInterface) => {
    const state_INTERNAL = atom<GitSocketError | any>({
      key: `git${capitalize(key)}_INTERNAL`,
      default: DEFAULT_SIMPLE_GIT_RETURN_VALUES[key],
      effects: [
        ({ setSelf }) => {
          socket.on(key, (result) => setSelf(result))
        },
      ],
    })
    const clientInterface = {
      state: selector({
        key: `git${capitalize(key)}`,
        get: ({ get }) => get(state_INTERNAL),
      }),
      action: (...args: Parameters<GitInterface[keyof GitInterface]>) =>
        socket.emit(key, ...args),
    }
    return clientInterface
  }
  for (const [key] of recordToEntries(DEFAULT_SIMPLE_GIT_RETURN_VALUES)) {
    completeInterface[key] = makeClientInterface(key)
  }
  return completeInterface
}
