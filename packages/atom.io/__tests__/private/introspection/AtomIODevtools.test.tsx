import { act, fireEvent, render, waitFor } from "@testing-library/react"
import type { Logger } from "atom.io"
import { Silo } from "atom.io"
import * as AR from "atom.io/react"
import { AtomIODevtools } from "atom.io/react-devtools"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"

import * as Utils from "../../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 2

let i = 0
let $: Silo
let willClearLocalStorage = false
let logger: Logger

beforeEach(() => {
	if (willClearLocalStorage) localStorage.clear()
	$ = new Silo({ name: `react-store-${i}`, lifespan: `ephemeral` })
	$.store.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = $.store.logger = Utils.createNullLogger()
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(Utils, `stdout`)
	i++
	willClearLocalStorage = true
})

afterEach(() => {
	expect(logger.warn).not.toHaveBeenCalled()
	expect(logger.error).not.toHaveBeenCalled()
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
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
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

		await waitFor(() => getByTestId(`open-close-state-myObject`))

		act(() => {
			getByTestId(`open-close-state-myObject`).click()
		})

		await waitFor(() => getByTestId(`myObject-state-editor-property-a`))
		await waitFor(() => getByTestId(`myObject-state-editor-property-b`))

		act(() => {
			fireEvent.change(getByTestId(`myObject-state-editor-property-a-rename`), {
				target: { value: `c` },
			})
		})

		await waitFor(() =>
			getByTestId(`myObject-state-editor-property-c-number-input`),
		)

		debug()
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

		act(() => {
			getByTestId(`myObject-state-editor-property-c-delete`).click()
		})

		expect($.getState(objectAtom)).toEqual({ b: 2 })

		act(() => {
			getByTestId(`myObject-state-editor-add-property`).click()
		})

		act(() => {
			fireEvent.change(
				getByTestId(`myObject-state-editor-property-new_property-rename`),
				{
					target: { value: `e` },
				},
			)
		})

		await waitFor(() => getByTestId(`myObject-state-editor-property-e`))
		expect($.getState(objectAtom)).toEqual({ b: 2, e: `` })

		act(() => {
			fireEvent.change(getByTestId(`myObject-state-editor-property-e-recast`), {
				target: { value: `number` },
			})
		})

		expect($.getState(objectAtom)).toEqual({ b: 2, e: 0 })
	})
	test(`nested object`, async () => {
		const objectAtom = $.atom<Record<string, Record<string, number>>>({
			key: `myObject`,
			default: { a: { b: 1 } },
		})

		const { getByTestId /* debug */ } = scenario()

		await waitFor(() => getByTestId(`open-close-state-myObject`))

		expect($.getState(objectAtom)).toEqual({ a: { b: 1 } })

		act(() => {
			getByTestId(`open-close-state-myObject`).click()
		})

		await waitFor(() => getByTestId(`myObject-state-editor-property-a`))

		act(() => {
			getByTestId(`myObject-state-editor-property-a-open-close`).click()
		})
		await waitFor(() =>
			getByTestId(`myObject-state-editor-property-a-property-b`),
		)

		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
})

describe(`editing an array atom`, () => {
	test(`array`, async () => {
		const arrayAtom = $.atom<string[]>({ key: `myArray`, default: [`A`] })

		const { getByTestId /* debug */ } = scenario()

		await waitFor(() => getByTestId(`open-close-state-myArray`))

		act(() => {
			getByTestId(`open-close-state-myArray`).click()
		})

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

		act(() => {
			getByTestId(`myArray-state-editor-add-element`).click()
		})
		expect($.getState(arrayAtom)).toEqual([`B`, ``])

		// recast to number
		act(() => {
			fireEvent.change(getByTestId(`myArray-state-editor-element-1-recast`), {
				target: { value: `number` },
			})
		})
		expect($.getState(arrayAtom)).toEqual([`B`, 0])

		act(() => {
			getByTestId(`myArray-state-editor-element-1-delete`).click()
		})
		expect($.getState(arrayAtom)).toEqual([`B`])

		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
})

describe(`displaying non-JSON`, () => {
	test(`undefined`, () => {
		$.atom<undefined>({ key: `myUndefined`, default: undefined })

		const { getByTestId } = scenario()

		getByTestId(`state-myUndefined`)
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
})

describe(`editing selectors`, () => {
	test(`selector that depends on an atom`, async () => {
		const letterState = $.atom<string>({ key: `letter`, default: `A` })
		const _doubleLetterState = $.selector<string>({
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
		const _selectionsWithoutGreenState = $.selector<Set<string>>({
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

describe(`displaying readonly selectors`, () => {
	test(`array selector`, async () => {
		const selectionsState = $.atom<number[]>({
			key: `selections`,
			default: [1, 2, 3],
		})
		const _evenSelectionsState = $.selector<number[]>({
			key: `evenSelections`,
			get: ({ get }) => get(selectionsState).filter((n) => n % 2 === 0),
		})

		const { getByTestId } = scenario()

		act(() => {
			getByTestId(`view-selectors`).click()
		})

		await waitFor(() => getByTestId(`open-close-state-evenSelections`))
		act(() => {
			getByTestId(`open-close-state-evenSelections`).click()
		})

		await waitFor(() => getByTestId(`evenSelections-state-editor-element-0`))

		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
})

describe(`working with families`, () => {
	test(`atom family`, async () => {
		const countAtoms = $.atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		const _countAtomA = $.findState(countAtoms, `A`)
		const _countAtomB = $.findState(countAtoms, `B`)

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
		const countAtom = $.atom<number>({ key: `count`, default: 0 })
		const doubleSelector = $.selector<number>({
			key: `double`,
			get: ({ get }) => get(countAtom) * 2,
			set: ({ set }, newValue) => {
				set(countAtom, newValue / 2)
			},
		})
		const decrementTX = $.transaction<() => void>({
			key: `reset`,
			do: ({ set }) => {
				set(countAtom, (c) => c - 1)
			},
		})
		const tripleAndDecrementTX = $.transaction<() => void>({
			key: `tripleAndDecrement`,
			do: ({ get, set, run }) => {
				set(countAtom, (c) => c + get(doubleSelector))
				run(decrementTX)()
			},
		})
		const _letterTL = $.timeline({
			key: `countTL`,
			scope: [countAtom],
		})

		const { getByTestId /* debug */ } = scenario()

		act(() => {
			getByTestId(`view-timelines`).click()
		})

		await waitFor(() => getByTestId(`timeline-countTL`))

		act(() => {
			getByTestId(`open-close-timeline-countTL`).click()
		})

		act(() => {
			$.setState(countAtom, 1)
		})

		await waitFor(() => getByTestId(`timeline-update-count-0`))

		act(() => {
			$.setState(doubleSelector, 2)
		})

		await waitFor(() => getByTestId(`timeline-update-double-1`))

		act(() => {
			$.runTransaction(tripleAndDecrementTX)()
		})

		await waitFor(() => getByTestId(`timeline-update-tripleAndDecrement-2`))

		// debug()
	})
})

describe(`miscellaneous tool behavior`, () => {
	test(`closing the devtools`, async () => {
		willClearLocalStorage = false

		$.atom<boolean>({ key: `example`, default: true })

		const { getByTestId } = scenario()

		await waitFor(() => getByTestId(`example-state-editor-boolean-input`))

		act(() => {
			$.setState({ type: `atom`, key: `🔍 Devtools Are Open` }, false)
		})

		await waitFor(() => {
			try {
				getByTestId(`example-state-editor-boolean-input`)
			} catch (_) {
				return
			}
			throw new Error(`Expected element to not be found`)
		})
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
	test(`stays closed between reloads`, async () => {
		$.atom<boolean>({ key: `example`, default: true })

		const { getByTestId } = scenario()

		await waitFor(() => {
			try {
				getByTestId(`example-state-editor-boolean-input`)
			} catch (_) {
				return
			}
			throw new Error(`Expected element to not be found`)
		})
	})
})
