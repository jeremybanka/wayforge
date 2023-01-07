import type { FC } from "react"

import { css } from "@emotion/react"

export const Explorer: FC = () => {
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
