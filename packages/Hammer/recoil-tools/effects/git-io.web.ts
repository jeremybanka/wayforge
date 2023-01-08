import { atom, selector } from "recoil"
import type { StatusResult } from "simple-git"
import type { Socket } from "socket.io-client"

import { DEFAULT_STATUS_RESULT } from "./git-io"
import type { GitClientEvents, GitServerEvents } from "./git-io.node"

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

export type GitClientSocket = Socket<GitServerEvents, GitClientEvents>

export const initGitStatusState = (socket: GitClientSocket) => {
  const gitStatusState_INTERNAL = atom<StatusResult>({
    key: `gitStatus_INTERNAL`,
    default: DEFAULT_STATUS_RESULT,
    effects: [
      ({ setSelf }) => {
        socket.emit(`status`)
        socket.on(`status`, (status) => setSelf(status))
      },
    ],
  })
  return selector<StatusResult>({
    key: `gitStatus`,
    get: ({ get }) => get(gitStatusState_INTERNAL),
  })
}
