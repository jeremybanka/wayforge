import type { FC } from "react"

import { css } from "@emotion/react"
import { atom, useRecoilValue } from "recoil"

import { isGitSocketError } from "~/packages/@git-io/src/git-io"
import { initGitClientTools } from "~/packages/@git-io/src/git-io.web"
import { recordToEntries } from "~/packages/anvl/src/object"

import { Combo } from "./components/Combo"
import { socket } from "./services/socket"

const git = initGitClientTools(socket)

const z = atom<string[]>({
  key: `z`,
  default: [],
})

export const Explorer: FC = () => {
  const gitStatus = useRecoilValue(git.status.state)
  const fetchGitStatus = git.status.action
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
      <div>
        {isGitSocketError(gitStatus) ? (
          gitStatus.title
        ) : (
          <ul>
            {gitStatus.not_added.map((filename) => (
              <li key={filename}>{filename}</li>
            ))}
          </ul>
        )}
        <button onClick={() => fetchGitStatus()}>Fetch</button>
        <Combo options={[`a`, `b`, `c`]} selectionsState={z} />
      </div>
    </div>
  )
}
