import type { AtomToken } from "atom.io"
import {
	atom,
	atomFamily,
	findState,
	getState,
	mutableAtom,
	resetState,
	runTransaction,
	selectorFamily,
	setState,
	transaction,
} from "atom.io"
import { useI, useO } from "atom.io/solid"
import { OList } from "atom.io/transceivers/o-list"
import { Rational } from "rationality"
import type { JSX } from "solid-js"
import { For, Show } from "solid-js"

import css from "./App.tsx.module.css"

type RationalKey = `rat::${string}`
const arbitrary = () => Math.random().toString(36).slice(2)

const newRationalNumeratorAtom = atom<bigint | undefined>({
	key: `newRationalNumerator`,
	default: undefined,
})
const newRationalDenominatorAtom = atom<bigint | undefined>({
	key: `newRationalDenominator`,
	default: undefined,
})
const newNumeratorAtoms = atomFamily<bigint | undefined, RationalKey>({
	key: `newNumerator`,
	default: undefined,
})
const newDenominatorAtoms = atomFamily<bigint | undefined, RationalKey>({
	key: `newDenominator`,
	default: undefined,
})

const rationalListAtom = mutableAtom<OList<RationalKey>>({
	key: `rationalList`,
	class: OList,
})

const rationalAtoms = atomFamily<Rational, RationalKey>({
	key: `rational`,
	default: () => new Rational(0n, 1n),
})
const simplifiedSelectors = selectorFamily<
	[numerator: bigint, denominator: bigint],
	RationalKey
>({
	key: `simplified`,
	get:
		(key) =>
		({ get }) => {
			const [numerator, denominator] = get(rationalAtoms, key).simplify()
			return [numerator, denominator]
		},
})
const floatSelectors = selectorFamily<number, RationalKey>({
	key: `float`,
	get:
		(key) =>
		({ get }) => {
			const [numerator, denominator] = get(simplifiedSelectors, key)
			return Number(numerator) / Number(denominator)
		},
})
const numberBitsSelectors = selectorFamily<(`0` | `1`)[], RationalKey>({
	key: `numberBits`,
	get:
		(key) =>
		({ get }) => {
			const [numerator, denominator] = get(simplifiedSelectors, key)
			const value = Number(numerator) / Number(denominator)
			const buffer = new ArrayBuffer(8)
			const view = new DataView(buffer)
			view.setFloat64(0, value, false) // big-endian
			const bytes = new Uint8Array(buffer)
			const bits = Array.from(bytes)
				.map((b) => b.toString(2).padStart(8, `0`))
				.join(``)
			return [...bits].map((bit) => (bit === `1` ? `1` : `0`))
		},
})
const isFloatPreciseSelectors = selectorFamily<boolean, RationalKey>({
	key: `isFloatPrecise`,
	get:
		(key) =>
		({ get }) => {
			const [, den] = get(simplifiedSelectors, key)
			if (den === 0n) return false
			return den > 0n && (den & (den - 1n)) === 0n
		},
})
const approximateValueSelectors = selectorFamily<string, RationalKey>({
	key: `approximateValue`,
	get:
		(key) =>
		({ get }) => {
			const value = get(floatSelectors, key)
			if (!Number.isFinite(value)) return value.toString()
			const rounded = Number(value.toPrecision(5))
			return rounded.toString()
		},
})

const combineIntoRationalTx = transaction<
	(key: RationalKey, operation: `add` | `div` | `mul` | `sub`) => void
>({
	key: `combineIntoRationalTx`,
	do: ({ get, set, reset }, key, operation) => {
		const num = get(newNumeratorAtoms, key) ?? 1n
		const den = get(newDenominatorAtoms, key) ?? 1n
		set(rationalAtoms, key, get(rationalAtoms, key)[operation](num, den))
		reset(newNumeratorAtoms, key)
		reset(newDenominatorAtoms, key)
	},
})

export function App(): JSX.Element {
	const rationals = useO(rationalListAtom)
	return (
		<app class={css.class}>
			<header>
				<h1>Rationality Playground</h1>
			</header>
			<main>
				<For each={rationals()}>{(key) => <RationalBreakdown key={key} />}</For>
				<new-rational>
					<RationalFields
						numeratorAtom={newRationalNumeratorAtom}
						denominatorAtom={newRationalDenominatorAtom}
					/>
					<button
						type="button"
						onClick={() => {
							const key: RationalKey = `rat::${arbitrary()}`
							runTransaction(combineIntoRationalTx)(key, `add`)
							const newNumerator = getState(newRationalNumeratorAtom) ?? 1n
							const newDenominator = getState(newRationalDenominatorAtom) ?? 1n
							const rational = new Rational(newNumerator, newDenominator)
							setState(rationalAtoms, key, rational)
							setState(rationalListAtom, (list) => (list.push(key), list))
							resetState(newRationalNumeratorAtom)
							resetState(newRationalDenominatorAtom)
						}}
					>
						Add
					</button>
				</new-rational>
			</main>
		</app>
	)
}

export function RationalBreakdown(props: { key: RationalKey }): JSX.Element {
	const rational = useO(rationalAtoms, props.key)
	const simplified = useO(simplifiedSelectors, props.key)
	const float = useO(floatSelectors, props.key)
	const isFloatPrecise = useO(isFloatPreciseSelectors, props.key)
	const approximateValue = useO(approximateValueSelectors, props.key)
	const bits = useO(numberBitsSelectors, props.key)
	return (
		<rational-breakdown>
			<fraction-list>
				<For each={[...rational().entries()]}>
					{([denominator, numerator], index) => {
						return (
							<>
								<Show when={index() !== 0}>
									<plus>+</plus>
								</Show>
								<Fraction numerator={numerator} denominator={denominator} />
							</>
						)
					}}
				</For>
				<infix-buttons>
					<button
						type="button"
						onClick={() => {
							runTransaction(combineIntoRationalTx)(props.key, `sub`)
						}}
					>
						−
					</button>
					<button
						type="button"
						onClick={() => {
							runTransaction(combineIntoRationalTx)(props.key, `add`)
						}}
					>
						+
					</button>
					<button
						type="button"
						onClick={() => {
							runTransaction(combineIntoRationalTx)(props.key, `div`)
						}}
					>
						÷
					</button>
					<button
						type="button"
						onClick={() => {
							runTransaction(combineIntoRationalTx)(props.key, `mul`)
						}}
					>
						×
					</button>
				</infix-buttons>
				<RationalCombineFields key={props.key} />
			</fraction-list>

			<equals>=</equals>
			<Fraction numerator={simplified()[0]} denominator={simplified()[1]} />
			<equals>{isFloatPrecise() ? `=` : `≈`}</equals>
			<quotient>
				<quotient-bits>
					<For each={bits()}>
						{(bit) => <bit data-css={bit === `1` ? `one` : undefined} />}
					</For>
				</quotient-bits>
				<number>{isFloatPrecise() ? float() : approximateValue()}</number>
			</quotient>
		</rational-breakdown>
	)
}

export function Fraction(props: {
	numerator: bigint
	denominator: bigint
}): JSX.Element {
	return (
		<fraction>
			<numerator data-css={props.numerator === 1n ? `one` : undefined}>
				{Number(props.numerator)}
			</numerator>
			<solidus />
			<denominator data-css={props.denominator === 1n ? `one` : undefined}>
				{Number(props.denominator)}
			</denominator>
		</fraction>
	)
}

export function RationalCombineFields({
	key,
}: {
	key: RationalKey
}): JSX.Element {
	const numeratorAtom = findState(newNumeratorAtoms, key)
	const denominatorAtom = findState(newDenominatorAtoms, key)
	return (
		<RationalFields
			numeratorAtom={numeratorAtom}
			denominatorAtom={denominatorAtom}
		/>
	)
}

export function RationalFields({
	numeratorAtom,
	denominatorAtom,
}: {
	numeratorAtom: AtomToken<bigint | undefined>
	denominatorAtom: AtomToken<bigint | undefined>
}): JSX.Element {
	const numerator = useO(numeratorAtom)
	const setNumerator = useI(numeratorAtom)
	const denominator = useO(denominatorAtom)
	const setDenominator = useI(denominatorAtom)
	return (
		<fieldset>
			<input
				type="number"
				value={numerator()?.toString()}
				onInput={(event) => {
					setNumerator(BigInt(event.currentTarget.value))
				}}
				placeholder="1"
			/>
			<solidus />
			<input
				type="number"
				value={denominator()?.toString()}
				onInput={(event) => {
					setDenominator(BigInt(event.currentTarget.value))
				}}
				placeholder="1"
			/>
		</fieldset>
	)
}
