import type { RecoilState, RecoilValueReadOnly } from "recoil"
import { atom, selector } from "recoil"
import type { StatusResult } from "simple-git"
import type { Socket } from "socket.io-client"

import { DEFAULT_STATUS_RESULT } from "./git-io"
import type {
  GitClientEvents,
  GitServerEvents,
  GitSocketError,
} from "./git-io.node"

export type GitClientSocket = Socket<GitServerEvents, GitClientEvents>

export const initGitStatusState = (
  socket: GitClientSocket
): RecoilValueReadOnly<GitSocketError | StatusResult> => {
  const gitStatusState_INTERNAL = atom<GitSocketError | StatusResult>({
    key: `gitStatus_INTERNAL`,
    default: DEFAULT_STATUS_RESULT,
    effects: [
      ({ setSelf }) => {
        socket.emit(`status`)
        socket.on(`status`, (status) => setSelf(status))
      },
    ],
  })
  return selector({
    key: `gitStatus`,
    get: ({ get }) => get(gitStatusState_INTERNAL),
  })
}
