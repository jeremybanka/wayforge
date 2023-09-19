import { AtomIODevtools } from "atom.io/react-devtools"
import type { FC } from "react"

import { setLogLevel } from "~/packages/atom.io/src"
import scss from "./App.module.scss"
import { main } from "./components/containers/<main>"

setLogLevel(`info`)

export const App: FC = () => (
	<main className={scss.class}>
		<header>Strand</header>
		<main.auspicious>
			Hello
			<AtomIODevtools />
		</main.auspicious>
	</main>
)
