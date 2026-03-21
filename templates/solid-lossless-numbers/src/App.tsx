import {
	atom,
	atomFamily,
	mutableAtom,
	runTransaction,
	selector,
	selectorFamily,
	setState,
	transaction,
} from "atom.io"
import { useI, useO } from "atom.io/solid"
import { OList } from "atom.io/transceivers/o-list"
import { getPrimeFactors, Rational } from "rationality"
import type { JSX } from "solid-js"
import { For, Show } from "solid-js"

import css from "./App.tsx.module.css"

type RationalKey = `rat::${string}`

const newNumeratorAtoms = atomFamily<bigint, RationalKey>({
	key: `newNumerator`,
	default: 1n,
})
const newDenominatorAtoms = atomFamily<bigint, RationalKey>({
	key: `newDenominator`,
	default: 1n,
})

const rationalListAtom = mutableAtom<OList<RationalKey>>({
	key: `rationalList`,
	class: OList,
})

const rationalAtoms = atomFamily<Rational, RationalKey>({
	key: `rational`,
	default: new Rational(3n, 10n),
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
const floatDescriptionSelectors = selectorFamily<FloatDescription, RationalKey>({
	key: `floatDescription`,
	get:
		(key) =>
		({ get }) => {
			const [numerator, denominator] = get(simplifiedSelectors, key)
			const value = Number(numerator) / Number(denominator)
			return inspectFloat64(value)
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
	do: ({ get, set }, key, operation) => {
		const num = get(newNumeratorAtoms, key)
		const den = get(newDenominatorAtoms, key)
		set(rationalAtoms, key, get(rationalAtoms, key)[operation](num, den))
		set(newNumeratorAtoms, key, 1n)
		set(newDenominatorAtoms, key, 1n)
	},
})

export function App(): JSX.Element {
	const rationals = useO(rationalListAtom)
	return (
		<app class={css.class}>
			<header>
				<h1>Rationality Playground</h1>
				<button
					type="button"
					onClick={() => {
						setState(
							rationalListAtom,
							(list) => (
								list.push(`rat::${Math.random().toString(36).slice(2)}`), list
							),
						)
					}}
				>
					Add
				</button>
			</header>
			<main>
				<For each={rationals()}>{(key) => <RationalBreakdown key={key} />}</For>
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
	const floatDescription = useO(floatDescriptionSelectors, props.key)
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
				<FractionForm key={props.key} />
			</fraction-list>

			<equals>=</equals>
			<Fraction numerator={simplified()[0]} denominator={simplified()[1]} />
			<equals>{isFloatPrecise() ? `=` : `≈`}</equals>
			<quotient>
				<quotient-bits>
					<For each={[...floatDescription().bits]}>
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

export function FractionForm({ key }: { key: RationalKey }): JSX.Element {
	const setDenominator = useI(newDenominatorAtoms, key)
	const denominator = useO(simplifiedSelectors, key)
	const setNumerator = useI(newNumeratorAtoms, key)
	const numerator = useO(simplifiedSelectors, key)
	return (
		<fieldset>
			<input
				type="number"
				value={numerator().toString()}
				onInput={(event) => {
					setNumerator(BigInt(event.currentTarget.value))
				}}
				placeholder="1"
			/>
			<solidus />
			<input
				type="number"
				value={denominator().toString()}
				onInput={(event) => {
					setDenominator(BigInt(event.currentTarget.value))
				}}
				placeholder="1"
			/>
		</fieldset>
	)
}

type FloatDescription = {
	value: number
	bits: string
	sign: string
	exponent: {
		bits: string
		raw: number
		unbiased: number
	}
	mantissa: {
		bits: string
	}
	significand: string
	formula: string
}
function inspectFloat64(value: number): FloatDescription {
	const buffer = new ArrayBuffer(8)
	const view = new DataView(buffer)
	view.setFloat64(0, value, false) // big-endian

	const bytes = new Uint8Array(buffer)

	// Build full 64-bit binary string
	const bits = Array.from(bytes)
		.map((b) => b.toString(2).padStart(8, `0`))
		.join(``)

	const sign = bits[0]
	const exponentBits = bits.slice(1, 12)
	const mantissaBits = bits.slice(12)

	const exponentRaw = Number.parseInt(exponentBits, 2)
	const exponentUnbiased = exponentRaw - 1023

	const isSubnormal = exponentRaw === 0

	const significand = isSubnormal ? `0.${mantissaBits}` : `1.${mantissaBits}`

	return {
		value,

		bits,

		sign,

		exponent: {
			bits: exponentBits,
			raw: exponentRaw,
			unbiased: exponentUnbiased,
		},

		mantissa: {
			bits: mantissaBits,
		},

		significand,

		formula: isSubnormal
			? `(-1)^${sign} × 2^(${1 - 1023}) × 0.${mantissaBits}`
			: `(-1)^${sign} × 2^(${exponentUnbiased}) × 1.${mantissaBits}`,
	}
}
