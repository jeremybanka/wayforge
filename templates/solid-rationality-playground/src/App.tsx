import { atom, atomFamily, selector, selectorFamily } from "atom.io"
import { useI, useO } from "atom.io/solid"
import { For, Show } from "solid-js"
import { Rational, getPrimeFactors } from "rationality"

type RationalId = string
type StepId = `step-${number}`
type ExpressionStep = {
	id: StepId
	mode: `mul` | `div`
	source: RationalId
}

const RATIONAL_IDS = [`alpha`, `beta`, `gamma`, `delta`] as const

const createPreset = (id: RationalId): Rational => {
	switch (id) {
		case `alpha`:
			return new Rational(1n, 2n).add(1n, 3n)
		case `beta`:
			return new Rational(5n, 7n).add(1n, 14n)
		case `gamma`:
			return new Rational(11n, 6n).sub(1n, 4n)
		case `delta`:
			return new Rational(9n, 10n).mul(5n, 3n)
	}
	return new Rational(1n, 1n)
}

const cloneRational = (value: Rational): Rational => new Rational().add(value)

const abs = (value: bigint): bigint => (value < 0n ? -value : value)

const formatFraction = (numerator: bigint, denominator: bigint): string =>
	denominator === 1n ? `${numerator}` : `${numerator}/${denominator}`

const formatSimplified = (value: Rational): string => {
	const [numerator, denominator] = value.simplify()
	return formatFraction(numerator, denominator)
}

const formatConsolidated = (value: Rational): string => {
	const [numerator, denominator] = value.consolidate()
	return formatFraction(numerator, denominator)
}

const approximate = (value: Rational): number => {
	const [numerator, denominator] = value.simplify()
	return Number(numerator) / Number(denominator)
}

const describeTerms = (value: Rational): string[] =>
	Array.from(value.entries(), ([denominator, numerator]) =>
		formatFraction(numerator, denominator),
	)

const describePrimeFactors = (value: bigint): string[] => {
	const normalized = abs(value)
	if (normalized === 0n) return [`0`]
	if (normalized === 1n) return [`1`]
	const factors = [...getPrimeFactors(normalized).entries()]
	return factors.map(([factor, count]) =>
		count === 1n ? `${factor}` : `${factor}^${count}`,
	)
}

const parseBigIntText = (value: string): bigint | null => {
	if (!/^-?\d+$/.test(value.trim())) return null
	try {
		return BigInt(value.trim())
	} catch {
		return null
	}
}

const parseFractionDraft = (
	numeratorText: string,
	denominatorText: string,
):
	| { ok: true; numerator: bigint; denominator: bigint }
	| { ok: false; reason: string } => {
	const numerator = parseBigIntText(numeratorText)
	if (numerator === null)
		return { ok: false, reason: `Numerator must be an integer.` }
	const denominator = parseBigIntText(denominatorText)
	if (denominator === null) {
		return { ok: false, reason: `Denominator must be an integer.` }
	}
	if (denominator === 0n) {
		return { ok: false, reason: `Denominator cannot be zero.` }
	}
	return { ok: true, numerator, denominator }
}

const operationSymbol = (mode: ExpressionStep[`mode`]): string =>
	mode === `mul` ? `×` : `÷`

const rationalAtoms = atomFamily<Rational, RationalId>({
	key: `rational`,
	default: (id) => createPreset(id),
})

const numeratorDraftAtoms = atomFamily<string, RationalId>({
	key: `draftNumerator`,
	default: `1`,
})

const denominatorDraftAtoms = atomFamily<string, RationalId>({
	key: `draftDenominator`,
	default: `2`,
})

const harmonicStepAtoms = atomFamily<number, RationalId>({
	key: `harmonicStep`,
	default: 5,
})

const expressionBaseAtom = atom<RationalId>({
	key: `expressionBase`,
	default: `alpha`,
})

const expressionStepsAtom = atom<ExpressionStep[]>({
	key: `expressionSteps`,
	default: [
		{ id: `step-1`, mode: `mul`, source: `beta` },
		{ id: `step-2`, mode: `div`, source: `gamma` },
		{ id: `step-3`, mode: `mul`, source: `delta` },
	],
})

const compareLeftAtom = atom<RationalId>({
	key: `compareLeft`,
	default: `alpha`,
})

const compareRightAtom = atom<RationalId>({
	key: `compareRight`,
	default: `gamma`,
})

const simplifiedSelectors = selectorFamily<number, RationalId>({
	key: `simplifiedValue`,
	get:
		(id) =>
		({ get }) =>
			approximate(get(rationalAtoms, id)),
})

const simplifiedTextSelectors = selectorFamily<string, RationalId>({
	key: `simplifiedText`,
	get:
		(id) =>
		({ get }) =>
			formatSimplified(get(rationalAtoms, id)),
})

const consolidatedTextSelectors = selectorFamily<string, RationalId>({
	key: `consolidatedText`,
	get:
		(id) =>
		({ get }) =>
			formatConsolidated(get(rationalAtoms, id)),
})

const termSelectors = selectorFamily<string[], RationalId>({
	key: `rationalTerms`,
	get:
		(id) =>
		({ get }) =>
			describeTerms(get(rationalAtoms, id)),
})

const factorSelectors = selectorFamily<
	{ numerator: string[]; denominator: string[] },
	RationalId
>({
	key: `rationalFactors`,
	get:
		(id) =>
		({ get }) => {
			const rational = get(rationalAtoms, id)
			const [numerator, denominator] = rational.simplify()
			return {
				numerator: describePrimeFactors(numerator),
				denominator: describePrimeFactors(denominator),
			}
		},
})

const expressionSummarySelector = selector<{
	exact: string
	consolidated: string
	approximation: number
	trace: string[]
	terms: string[]
	factors: { numerator: string[]; denominator: string[] }
}>({
	key: `expressionSummary`,
	get: ({ get }) => {
		const base = get(expressionBaseAtom)
		const steps = get(expressionStepsAtom)
		const result = cloneRational(get(rationalAtoms, base))
		const trace = [`start with ${base}: ${formatSimplified(result)}`]
		for (const step of steps) {
			const source = get(rationalAtoms, step.source)
			if (step.mode === `mul`) {
				result.mul(source)
			} else {
				result.div(source)
			}
			trace.push(
				`${operationSymbol(step.mode)} ${step.source} → ${formatSimplified(result)}`,
			)
		}
		const [numerator, denominator] = result.simplify()
		return {
			exact: formatFraction(numerator, denominator),
			consolidated: formatConsolidated(result),
			approximation: approximate(result),
			trace,
			terms: describeTerms(result),
			factors: {
				numerator: describePrimeFactors(numerator),
				denominator: describePrimeFactors(denominator),
			},
		}
	},
})

const comparisonSelector = selector<{
	symbol: `>` | `<` | `=`
	copy: string
	leftId: RationalId
	rightId: RationalId
	leftExact: string
	rightExact: string
}>({
	key: `comparison`,
	get: ({ get }) => {
		const leftId = get(compareLeftAtom)
		const rightId = get(compareRightAtom)
		const left = get(rationalAtoms, leftId)
		const right = get(rationalAtoms, rightId)
		if (left.isGreaterThan(right)) {
			return {
				symbol: `>`,
				copy: `${leftId} is greater than ${rightId}`,
				leftId,
				rightId,
				leftExact: formatSimplified(left),
				rightExact: formatSimplified(right),
			}
		}
		if (right.isGreaterThan(left)) {
			return {
				symbol: `<`,
				copy: `${leftId} is less than ${rightId}`,
				leftId,
				rightId,
				leftExact: formatSimplified(left),
				rightExact: formatSimplified(right),
			}
		}
		return {
			symbol: `=`,
			copy: `${leftId} and ${rightId} simplify to the same value`,
			leftId,
			rightId,
			leftExact: formatSimplified(left),
			rightExact: formatSimplified(right),
		}
	},
})

let nextStepId = 4

const newExpressionStep = (): ExpressionStep => ({
	id: `step-${nextStepId++}`,
	mode: `mul`,
	source: `alpha`,
})

export function App() {
	return (
		<div class="page-shell">
			<div class="page-glow page-glow-a" />
			<div class="page-glow page-glow-b" />
			<header class="hero">
				<div class="eyebrow">solid + atom.io/solid + rationality</div>
				<h1>Rational Lab</h1>
				<p>
					Build exact fractions, let them accumulate term-by-term, then send them
					through chained multiplication and division without losing a single
					bit.
				</p>
			</header>

			<main class="layout">
				<section class="column">
					<div class="section-header">
						<h2>Source Rationals</h2>
						<p>
							Each card stores a live <code>Rational</code> instance. Add or
							subtract new terms, scale it, or divide it by another fraction.
						</p>
					</div>

					<div class="card-grid">
						<For each={RATIONAL_IDS}>
							{(id, index) => (
								<RationalCard
									id={id}
									label={`R${index() + 1}`}
									accent={index() % 2 === 0 ? `gold` : `ink`}
								/>
							)}
						</For>
					</div>
				</section>

				<section class="column column-right">
					<ExpressionWorkbench />
					<ComparisonPanel />
				</section>
			</main>
		</div>
	)
}

function RationalCard(props: {
	id: RationalId
	label: string
	accent: `gold` | `ink`
}) {
	const exact = useO(simplifiedTextSelectors, props.id)
	const consolidated = useO(consolidatedTextSelectors, props.id)
	const approximation = useO(simplifiedSelectors, props.id)
	const terms = useO(termSelectors, props.id)
	const factors = useO(factorSelectors, props.id)
	const numeratorDraft = useO(numeratorDraftAtoms, props.id)
	const denominatorDraft = useO(denominatorDraftAtoms, props.id)
	const harmonicStep = useO(harmonicStepAtoms, props.id)

	const setRational = useI(rationalAtoms, props.id)
	const setNumeratorDraft = useI(numeratorDraftAtoms, props.id)
	const setDenominatorDraft = useI(denominatorDraftAtoms, props.id)
	const setHarmonicStep = useI(harmonicStepAtoms, props.id)

	const apply = (mode: `add` | `sub` | `mul` | `div`) => {
		const parsed = parseFractionDraft(numeratorDraft(), denominatorDraft())
		if (!parsed.ok) return
		setRational((current) => {
			const next = cloneRational(current)
			if (mode === `add`) next.add(parsed.numerator, parsed.denominator)
			if (mode === `sub`) next.sub(parsed.numerator, parsed.denominator)
			if (mode === `mul`) next.mul(parsed.numerator, parsed.denominator)
			if (mode === `div`) next.div(parsed.numerator, parsed.denominator)
			return next
		})
	}

	const reset = () => {
		setRational(createPreset(props.id))
		setNumeratorDraft(`1`)
		setDenominatorDraft(`2`)
		setHarmonicStep(5)
	}

	const addHarmonic = () => {
		setRational((current) => {
			const next = cloneRational(current)
			next.add(1n, BigInt(harmonicStep()))
			return next
		})
		setHarmonicStep((current) => current + 1)
	}

	const draftState = () =>
		parseFractionDraft(numeratorDraft(), denominatorDraft())
	const parsedDraft = draftState()

	return (
		<article class={`rational-card rational-card-${props.accent}`}>
			<header class="rational-card-head">
				<div>
					<div class="chip">{props.label}</div>
					<h3>{props.id}</h3>
				</div>
				<button class="ghost-button" type="button" onClick={reset}>
					reset
				</button>
			</header>

			<div class="number-stage">
				<div class="number-stage-label">simplified</div>
				<div class="fraction-display">{exact()}</div>
				<div class="approx-display">≈ {approximation().toFixed(6)}</div>
			</div>

			<div class="metrics">
				<div class="metric">
					<span>consolidated</span>
					<strong>{consolidated()}</strong>
				</div>
				<div class="metric">
					<span>stored terms</span>
					<strong>{terms().length}</strong>
				</div>
				<div class="metric">
					<span>next harmonic</span>
					<strong>+ 1/{harmonicStep()}</strong>
				</div>
			</div>

			<div class="term-strip">
				<For each={terms()}>
					{(term) => <span class="term-pill">{term}</span>}
				</For>
			</div>

			<div class="editor">
				<label>
					<span>numerator</span>
					<input
						value={numeratorDraft()}
						onInput={(event) => setNumeratorDraft(event.currentTarget.value)}
					/>
				</label>
				<label>
					<span>denominator</span>
					<input
						value={denominatorDraft()}
						onInput={(event) => setDenominatorDraft(event.currentTarget.value)}
					/>
				</label>
			</div>

			<Show when={!parsedDraft.ok}>
				<p class="validation-message">
					{!parsedDraft.ok ? parsedDraft.reason : ``}
				</p>
			</Show>

			<div class="button-row">
				<button
					type="button"
					onClick={() => apply(`add`)}
					disabled={!parsedDraft.ok}
				>
					add
				</button>
				<button
					type="button"
					onClick={() => apply(`sub`)}
					disabled={!parsedDraft.ok}
				>
					sub
				</button>
				<button
					type="button"
					onClick={() => apply(`mul`)}
					disabled={!parsedDraft.ok}
				>
					mul
				</button>
				<button
					type="button"
					onClick={() => apply(`div`)}
					disabled={!parsedDraft.ok}
				>
					div
				</button>
			</div>

			<div class="secondary-row">
				<button type="button" class="secondary" onClick={addHarmonic}>
					add harmonic step
				</button>
			</div>

			<div class="factor-panel">
				<div>
					<span>numerator factors</span>
					<div class="factor-list">
						<For each={factors().numerator}>
							{(factor) => <span class="factor-pill">{factor}</span>}
						</For>
					</div>
				</div>
				<div>
					<span>denominator factors</span>
					<div class="factor-list">
						<For each={factors().denominator}>
							{(factor) => <span class="factor-pill">{factor}</span>}
						</For>
					</div>
				</div>
			</div>
		</article>
	)
}

function ExpressionWorkbench() {
	const base = useO(expressionBaseAtom)
	const steps = useO(expressionStepsAtom)
	const summary = useO(expressionSummarySelector)

	const setBase = useI(expressionBaseAtom)
	const setSteps = useI(expressionStepsAtom)

	const addStep = () => {
		setSteps((current) => [...current, newExpressionStep()])
	}

	const updateStep = <K extends keyof ExpressionStep>(
		id: StepId,
		key: K,
		value: ExpressionStep[K],
	) => {
		setSteps((current) =>
			current.map((step) => (step.id === id ? { ...step, [key]: value } : step)),
		)
	}

	const removeStep = (id: StepId) => {
		setSteps((current) => current.filter((step) => step.id !== id))
	}

	return (
		<section class="workbench panel">
			<header class="panel-head">
				<div>
					<div class="eyebrow">expression mixer</div>
					<h2>Recombine the rationals</h2>
				</div>
				<button type="button" class="secondary" onClick={addStep}>
					add step
				</button>
			</header>

			<div class="base-selector">
				<label>
					<span>start from</span>
					<select
						value={base()}
						onChange={(event) =>
							setBase(event.currentTarget.value as RationalId)
						}
					>
						<For each={RATIONAL_IDS}>
							{(id) => <option value={id}>{id}</option>}
						</For>
					</select>
				</label>
			</div>

			<div class="step-list">
				<For each={steps()}>
					{(step, index) => (
						<div class="step-row">
							<div class="step-index">{index() + 1}</div>
							<select
								value={step.mode}
								onChange={(event) =>
									updateStep(
										step.id,
										`mode`,
										event.currentTarget.value as ExpressionStep[`mode`],
									)
								}
							>
								<option value="mul">multiply</option>
								<option value="div">divide</option>
							</select>
							<select
								value={step.source}
								onChange={(event) =>
									updateStep(
										step.id,
										`source`,
										event.currentTarget.value as RationalId,
									)
								}
							>
								<For each={RATIONAL_IDS}>
									{(id) => <option value={id}>{id}</option>}
								</For>
							</select>
							<button
								type="button"
								class="ghost-button"
								onClick={() => removeStep(step.id)}
							>
								remove
							</button>
						</div>
					)}
				</For>
			</div>

			<div class="result-banner">
				<div class="result-copy">
					<div class="eyebrow">exact result</div>
					<div class="result-fraction">{summary().exact}</div>
					<div class="result-approx">≈ {summary().approximation.toFixed(6)}</div>
				</div>
				<div class="result-meta">
					<div>
						<span>consolidated</span>
						<strong>{summary().consolidated}</strong>
					</div>
					<div>
						<span>terms carried</span>
						<strong>{summary().terms.length}</strong>
					</div>
				</div>
			</div>

			<div class="trace-panel">
				<div class="trace-column">
					<h3>trace</h3>
					<ol>
						<For each={summary().trace}>{(line) => <li>{line}</li>}</For>
					</ol>
				</div>
				<div class="trace-column">
					<h3>factor view</h3>
					<div class="factor-list">
						<For each={summary().factors.numerator}>
							{(factor) => <span class="factor-pill">{factor}</span>}
						</For>
					</div>
					<div class="divider-label">over</div>
					<div class="factor-list">
						<For each={summary().factors.denominator}>
							{(factor) => <span class="factor-pill">{factor}</span>}
						</For>
					</div>
				</div>
			</div>
		</section>
	)
}

function ComparisonPanel() {
	const left = useO(compareLeftAtom)
	const right = useO(compareRightAtom)
	const comparison = useO(comparisonSelector)
	const setLeft = useI(compareLeftAtom)
	const setRight = useI(compareRightAtom)

	return (
		<section class="panel compare-panel">
			<header class="panel-head">
				<div>
					<div class="eyebrow">comparison</div>
					<h2>Which rational wins?</h2>
				</div>
			</header>

			<div class="compare-controls">
				<label>
					<span>left</span>
					<select
						value={left()}
						onChange={(event) =>
							setLeft(event.currentTarget.value as RationalId)
						}
					>
						<For each={RATIONAL_IDS}>
							{(id) => <option value={id}>{id}</option>}
						</For>
					</select>
				</label>

				<div class="versus-token">{comparison().symbol}</div>

				<label>
					<span>right</span>
					<select
						value={right()}
						onChange={(event) =>
							setRight(event.currentTarget.value as RationalId)
						}
					>
						<For each={RATIONAL_IDS}>
							{(id) => <option value={id}>{id}</option>}
						</For>
					</select>
				</label>
			</div>

			<div class="compare-values">
				<div>
					<div class="compare-label">{comparison().leftId}</div>
					<strong>{comparison().leftExact}</strong>
				</div>
				<div>
					<div class="compare-label">{comparison().rightId}</div>
					<strong>{comparison().rightExact}</strong>
				</div>
			</div>

			<p class="compare-copy">{comparison().copy}</p>
		</section>
	)
}
