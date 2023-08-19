import { css } from "@emotion/react"
import { AtomIODevtools } from "atom.io/react-devtools"
import type { FC } from "react"

import { DemoExplorer } from "./components/Demos"

export const App: FC = () => {
	return (
		<main
			css={css`
        display: flex;
        flex-flow: column;
        justify-content: center;
        h1 {
          text-align: center;
        }
      `}
		>
			<h1>atom.io</h1>
			<DemoExplorer />
			<AtomIODevtools />
		</main>
	)
}
