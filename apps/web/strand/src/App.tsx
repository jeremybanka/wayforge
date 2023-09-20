import { AtomIODevtools } from "atom.io/react-devtools"
import type { FC } from "react"

import type { MutableAtomToken } from "atom.io"
import { setLogLevel } from "atom.io"
import { useI, useJSON } from "atom.io/react"
import { usePullMutable, useServerAction } from "atom.io/realtime-react"
import scss from "./App.module.scss"

import type { TransceiverSet } from "~/packages/anvl/reactivity"
import {
	addNumberCollectionTX,
	findNumberCollection,
	numberCollectionIndex,
} from "../../../node/kite/src/kite-store"

setLogLevel(`info`)

const Numbers: FC<{
	state: MutableAtomToken<TransceiverSet<number>, number[]>
}> = ({ state }) => {
	const setNumbers = useI(state)
	const numbers = useJSON(state)

	return (
		<section>
			<span>{state.key}</span>
			{numbers.map((number) => (
				<div key={number}>{number}</div>
			))}
			<button
				type="button"
				onClick={() => setNumbers((current) => current.add(numbers.length))}
			>
				Add
			</button>
		</section>
	)
}

export const App: FC = () => {
	usePullMutable(numberCollectionIndex)
	const keys = useJSON(numberCollectionIndex)
	const addNumberCollection = useServerAction(addNumberCollectionTX)
	return (
		<main className={scss.class}>
			{keys.map((key) => (
				<Numbers key={key} state={findNumberCollection(key)} />
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
