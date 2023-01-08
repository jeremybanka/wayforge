import { atom, selector } from "recoil"
import type { StatusResult } from "simple-git"
import type { Socket } from "socket.io-client"

import type { GitClientEvents, GitServerEvents } from "./git-io.node"

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

export type GitClientSocket = Socket<GitServerEvents, GitClientEvents>

export const initGitStatusState = (socket: GitClientSocket) => {
  const gitStatusState_INTERNAL = atom<StatusResult>({
    key: `gitStatus_INTERNAL`,
    default: {
      ahead: 0,
      behind: 0,
      current: ``,
      modified: [],
      not_added: [],
      conflicted: [],
      deleted: [],
      created: [],
      renamed: [],
      files: [],
      staged: [],
      tracking: ``,
      detached: false,
      isClean: () => true,
    },
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
