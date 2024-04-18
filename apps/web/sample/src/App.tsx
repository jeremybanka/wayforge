import { AtomIODevtools } from "atom.io/react-devtools"
import type { FC } from "react"

import scss from "./App.module.scss"
import { DemoExplorer } from "./components/Demos"

export const App: FC = () => {
	return (
		<main className={scss.class}>
			<h1>atom.io</h1>
			<DemoExplorer />
			<AtomIODevtools />
		</main>
	)
}
