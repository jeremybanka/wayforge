import {
	type MutableAtomFamilyToken,
	type MutableAtomToken,
	findState,
} from "atom.io"
import { useI, useJSON } from "atom.io/react"
import { AtomIODevtools } from "atom.io/react-devtools"
import {
	usePullMutable,
	usePullMutableFamilyMember,
	useServerAction,
} from "atom.io/realtime-react"
import type { SetRTX, SetRTXJson } from "atom.io/transceivers/set-rtx"
import type { FC } from "react"

import {
	addNumberCollectionTX,
	findNumberCollection,
	incrementNumberCollectionTX,
	numberCollectionIndex,
} from "../../../node/kite/src/kite-store"

import scss from "./App.module.scss"

const Numbers: FC<{
	subKey: string
	family: MutableAtomFamilyToken<SetRTX<number>, SetRTXJson<number>, string>
}> = ({ subKey, family }) => {
	const token = findState(family, subKey)
	usePullMutableFamilyMember(family, subKey)
	const setNumbers = useI(family, subKey)
	const numbers = useJSON(family, subKey)

	const increment = useServerAction(incrementNumberCollectionTX)

	return (
		<section>
			<button type="button" onClick={() => increment(token)}>
				Add
			</button>
			<span>{token.key}</span>
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
				<Numbers key={key} subKey={key} family={findNumberCollection} />
			))}
			<AtomIODevtools />
		</main>
	)
}
