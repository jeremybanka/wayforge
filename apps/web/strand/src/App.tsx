import { AtomIODevtools } from "atom.io/react-devtools"
import type { FC } from "react"

import { setLogLevel } from "atom.io"
import { useO } from "atom.io/react"
import { usePullMutable, useServerAction } from "atom.io/realtime-react"
import scss from "./App.module.scss"

import {
	addNumberCollectionTX,
	numberCollectionIndex,
} from "../../../node/kite/src/kite-store"

setLogLevel(`info`)

export const App: FC = () => {
	usePullMutable(numberCollectionIndex)
	const collectionIds = useO(numberCollectionIndex)
	const addNumberCollection = useServerAction(addNumberCollectionTX)
	return (
		<main className={scss.class}>
			{[...collectionIds].map((number) => (
				<div key={number}>{number}</div>
			))}
			<button
				type="button"
				onClick={() => addNumberCollection(Math.random().toString(36).slice(2))}
			>
				Add
			</button>
			<AtomIODevtools />
		</main>
	)
}
