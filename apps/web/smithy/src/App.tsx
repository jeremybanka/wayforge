import { css } from "@emotion/react"
import type { FC } from "react"
import { useRecoilValue } from "recoil"

import { Explorer } from "./Explorer"
import { Spaces } from "./NavigationSpace"
import Connected from "./assets/svg/connected.svg?react"
import Disconnected from "./assets/svg/disconnected.svg?react"
import { connectionState } from "./services/socket"

export const App: FC = () => {
	const connection = useRecoilValue(connectionState)
	return (
		<main
			css={css`
        display: flex;
        flex-flow: row;
      `}
		>
			<div
				css={css`
          position: fixed;
          top: 10px;
          right: 10px;
          height: 100px;
          width: 100px;
          svg {
            height: 100%;
            width: 100%;
          }
        `}
			>
				{connection ? <Connected /> : <Disconnected />}
			</div>
			<Explorer />
			<Spaces />
		</main>
	)
}
