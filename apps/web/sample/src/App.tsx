import { css } from "@emotion/react"
import type { FC } from "react"

import { AtomIODevtools } from "~/packages/atom.io/src/react-devtools"

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
