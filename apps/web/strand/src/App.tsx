import type { MutableAtomToken } from "atom.io"
import { setLogLevel } from "atom.io"
import { useI, useJSON } from "atom.io/react"
import { AtomIODevtools } from "atom.io/react-devtools"
import {
	usePullMutable,
	usePullMutableFamilyMember,
	useServerAction,
} from "atom.io/realtime-react"
import type {
	TransceiverSet,
	TransceiverSetJSON,
} from "atom.io/transceivers/set-io"
import type { FC } from "react"

import {
	addNumberCollectionTX,
	findNumberCollection,
	incrementNumberCollectionTX,
	numberCollectionIndex,
} from "../../../node/kite/src/kite-store"

import scss from "./App.module.scss"

setLogLevel(`warn`)

const Numbers: FC<{
	state: MutableAtomToken<TransceiverSet<number>, TransceiverSetJSON<number>>
}> = ({ state }) => {
	usePullMutableFamilyMember(state)
	const setNumbers = useI(state)
	const numbers = useJSON(state)

	const increment = useServerAction(incrementNumberCollectionTX)

	return (
		<section>
			<button type="button" onClick={() => increment(state)}>
				Add
			</button>
			<span>{state.key}</span>
			{numbers.members.map((number) => (
				<div key={number}>{number}</div>
			))}
		</section>
	)
}

export const App: FC = () => {
	usePullMutable(numberCollectionIndex)
	const { members: keys } = useJSON(numberCollectionIndex)
	const addNumberCollection = useServerAction(addNumberCollectionTX)
	return (
		<main className={scss.class}>
			<button
				type="button"
				onClick={() => addNumberCollection(Math.random().toString(36).slice(2))}
			>
				Add
			</button>
			{keys.map((key) => (
				<Numbers key={key} state={findNumberCollection(key)} />
			))}
			<AtomIODevtools />
		</main>
	)
}
