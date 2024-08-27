import { act, fireEvent, render, waitFor } from "@testing-library/react"
import type { Logger } from "atom.io"
import { Silo } from "atom.io"
import * as AR from "atom.io/react"
import { AtomIODevtools } from "atom.io/react-devtools"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"

import * as Utils from "../../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 0

let i = 0
let $: Silo
let willClearLocalStorage = false
let logger: Logger

beforeEach(() => {
	if (willClearLocalStorage) localStorage.clear()
	$ = new Silo({ name: `react-store-${i}`, lifespan: `ephemeral` })
	$.store.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = $.store.logger
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(Utils, `stdout`)
	i++
	willClearLocalStorage = true
})

const scenario = () =>
	render(
		<AR.StoreProvider store={$.store}>
			<AtomIODevtools />
		</AR.StoreProvider>,
	)

describe(`editing primitive atoms of a variety of types`, () => {
	test(`string`, () => {
		const stringAtom = $.atom<string>({ key: `myString`, default: `A` })

		const { getByTestId } = scenario()

		act(() => {
			const myStringInput = getByTestId(`myString-state-editor-string-input`)
			fireEvent.change(myStringInput, { target: { value: `hello` } })
		})

		expect($.getState(stringAtom)).toBe(`hello`)
	})

	test(`number`, () => {
		const numberAtom = $.atom<number>({ key: `myNumber`, default: 0 })

		const { getByTestId } = scenario()

		act(() => {
			const myNumberInput = getByTestId(`myNumber-state-editor-number-input`)
			fireEvent.change(myNumberInput, { target: { value: `1` } })
		})

		expect($.getState(numberAtom)).toBe(1)
	})

	test(`boolean`, () => {
		const booleanAtom = $.atom<boolean>({ key: `myBoolean`, default: false })

		const { getByTestId } = scenario()

		act(() => {
			const myBooleanInput = getByTestId(`myBoolean-state-editor-boolean-input`)
			fireEvent.click(myBooleanInput)
		})

		expect($.getState(booleanAtom)).toBe(true)
	})

	test(`null`, () => {
		const nullAtom = $.atom<null>({ key: `myNull`, default: null })

		const { getByTestId } = scenario()

		act(() => {
			const myNullInput = getByTestId(`myNull-state-editor-null`)
			fireEvent.click(myNullInput)
		})

		expect($.getState(nullAtom)).toBe(null)
	})
})

describe(`editing an object atom`, () => {
	test(`object`, async () => {
		const objectAtom = $.atom<Record<string, number>>({
			key: `myObject`,
			default: { a: 1, b: 2 },
		})

		const { getByTestId, debug } = scenario()

		await waitFor(() => getByTestId(`myObject-state-editor-property-a`))
		await waitFor(() => getByTestId(`myObject-state-editor-property-b`))

		act(() => {
			fireEvent.change(getByTestId(`myObject-state-editor-property-a-rename`), {
				target: { value: `c` },
			})
		})

		await waitFor(() => getByTestId(`myObject-state-editor-property-c`))

		expect($.getState(objectAtom)).toEqual({ b: 2, c: 1 })

		act(() => {
			fireEvent.change(
				getByTestId(`myObject-state-editor-property-c-number-input`),
				{
					target: { value: `3` },
				},
			)
		})

		expect($.getState(objectAtom)).toEqual({ b: 2, c: 3 })

		expect(JSON.stringify($.getState(objectAtom))).toBe(`{"c":3,"b":2}`)
		act(() => {
			getByTestId(`myObject-state-editor-sort-properties`).click()
		})
		expect(JSON.stringify($.getState(objectAtom))).toBe(`{"b":2,"c":3}`)
	})
})

describe(`editing arrays`, () => {
	test(`array`, async () => {
		const arrayAtom = $.atom<string[]>({ key: `myArray`, default: [`A`] })

		const { getByTestId, debug } = scenario()

		await waitFor(() => getByTestId(`myArray-state-editor-element-0`))

		act(() => {
			fireEvent.change(
				getByTestId(`myArray-state-editor-element-0-string-input`),
				{
					target: { value: `B` },
				},
			)
		})

		expect($.getState(arrayAtom)).toEqual([`B`])
	})
})

describe(`editing selectors`, () => {
	test(`selector that depends on an atom`, async () => {
		const letterState = $.atom<string>({ key: `letter`, default: `A` })
		const doubleLetterState = $.selector<string>({
			key: `doubleLetter`,
			get: ({ get }) => get(letterState) + get(letterState),
		})

		const { getByTestId } = scenario()

		act(() => {
			getByTestId(`view-selectors`).click()
		})
		await waitFor(() => getByTestId(`state-doubleLetter`))
	})

	test(`selector that filters a SetRTX`, async () => {
		const selectionsState = $.atom<SetRTX<string>, SetRTXJson<string>>({
			key: `selections`,
			default: () => new SetRTX([`green`]),
			mutable: true,
			toJson: (set) => set.toJSON(),
			fromJson: (json) => SetRTX.fromJSON(json),
		})
		const selectionsWithoutGreenState = $.selector<Set<string>>({
			key: `selectionsWithoutGreen`,
			get: ({ get }) => {
				const selectionsWithGreen = get(selectionsState)
				const selectionsWithoutGreen = new Set(selectionsWithGreen)
				selectionsWithoutGreen.delete(`green`)
				return selectionsWithoutGreen
			},
		})

		const { getByTestId } = scenario()

		act(() => {
			getByTestId(`view-selectors`).click()
		})
		await waitFor(() => getByTestId(`state-selectionsWithoutGreen`))
	})
})

describe(`working with families`, () => {
	test(`atom family`, async () => {
		const countAtoms = $.atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		const countAtomA = $.findState(countAtoms, `A`)
		const countAtomB = $.findState(countAtoms, `B`)

		const { getByTestId } = scenario()

		act(() => {
			getByTestId(`open-close-state-family-count`).click()
		})
		await waitFor(() => getByTestId(`state-count("A")`))
		await waitFor(() => getByTestId(`state-count("B")`))

		act(() => {
			fireEvent.change(getByTestId(`count("A")-state-editor-number-input`), {
				target: { value: `1` },
			})
		})
	})
})

describe(`working with transactions`, () => {
	test(`simple transaction`, async () => {
		const letterState = $.atom<string>({ key: `letter`, default: `A` })
		const setLetterTX = $.transaction<(newLetter: string) => void>({
			key: `setLetter`,
			do: ({ set }, newLetter) => {
				set(letterState, newLetter)
			},
		})

		const { getByTestId } = scenario()

		act(() => {
			getByTestId(`view-transactions`).click()
		})
		await waitFor(() => getByTestId(`transaction-setLetter`))

		act(() => {
			getByTestId(`open-close-transaction-setLetter`).click()
		})

		act(() => {
			$.runTransaction(setLetterTX)(`B`)
		})

		await waitFor(() => getByTestId(`transaction-update-setLetter-0`))
	})
})

describe(`working with timelines`, () => {
	test(`basic timeline`, async () => {
		const letterState = $.atom<string>({ key: `letter`, default: `A` })
		const letterTL = $.timeline({
			key: `letterTL`,
			scope: [letterState],
		})

		const { getByTestId } = scenario()

		act(() => {
			getByTestId(`view-timelines`).click()
		})

		await waitFor(() => getByTestId(`timeline-letterTL`))

		act(() => {
			getByTestId(`open-close-timeline-letterTL`).click()
		})

		act(() => {
			$.setState(letterState, `C`)
		})

		await waitFor(() => getByTestId(`timeline-update-letter-0`))
	})
})
