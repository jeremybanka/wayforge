import { AtomIODevtools } from "atom.io/react-devtools"
import type { FC } from "react"

import { DemoExplorer } from "./components/Demos"

import scss from "./App.module.scss"

export const App: FC = () => {
	return (
		<main className={scss.class}>
			<h1>atom.io</h1>
			<DemoExplorer />
			<AtomIODevtools />
		</main>
	)
}
