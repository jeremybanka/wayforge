import type { FC } from "react"

import { css } from "@emotion/react"
import { useRecoilValue } from "recoil"

import { initGitStatusState } from "~/packages/hamr/recoil-tools/effects/git-io.web"

import { socket } from "./services/socket"

const gitStatusState = initGitStatusState(socket)

export const Explorer: FC = () => {
  const gitStatus = useRecoilValue(gitStatusState)
  return (
    <div
      css={css`
        display: flex;
        flex-flow: column;
        height: 100%;
        width: 100px;
      `}
    >
      Explorer
    </div>
  )
}
