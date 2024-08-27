import { act, fireEvent, render, waitFor } from "@testing-library/react"
import type { Logger } from "atom.io"
import { Silo } from "atom.io"
import * as AR from "atom.io/react"
import { AtomIODevtools } from "atom.io/react-devtools"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"
import type { FC } from "react"

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

describe(`react-devtools`, () => {
	const scenario = () => {
		const letterState = $.atom<string>({
			key: `letter`,
			default: `A`,
		})
		const doubleLetterState = $.selector<string>({
			key: `doubleLetter`,
			get: ({ get }) => get(letterState) + get(letterState),
		})
		const setLetterTX = $.transaction<(newLetter: string) => void>({
			key: `setLetter`,
			do: ({ set }, newLetter) => {
				set(letterState, newLetter)
			},
		})
		const letterTL = $.timeline({
			key: `letterTL`,
			scope: [letterState],
		})
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
		const countAtoms = $.atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		const countAtom = $.findState(countAtoms, `count`)

		const arrayAtom = $.atom<string[]>({
			key: `array`,
			default: [`A`, `B`, `C`],
		})

		const myNullAtom = $.atom<null>({
			key: `myNull`,
			default: null,
		})

		const myUndefinedAtom = $.atom<undefined>({
			key: `myUndefined`,
			default: undefined,
		})

		const myBooleanAtom = $.atom<boolean>({
			key: `myBoolean`,
			default: false,
		})

		const Letter: FC = () => {
			const setLetter = AR.useI(letterState)
			const letter = AR.useO(letterState)
			return (
				<>
					<div data-testid={letter}>{letter}</div>
					<button
						type="button"
						onClick={() => {
							setLetter(`B`)
						}}
						data-testid="changeStateButton"
					/>
				</>
			)
		}
		const utils = render(
			<AR.StoreProvider store={$.store}>
				<Letter />
				<AtomIODevtools />
			</AR.StoreProvider>,
		)
		return { setLetterTX, ...utils }
	}
	it(`shows states`, async () => {
		const { setLetterTX, getByTestId, debug } = scenario()
		act(() => {
			const changeStateButton = getByTestId(`changeStateButton`)
			fireEvent.click(changeStateButton)
		})
		const option = getByTestId(`B`)

		await act(async () => {
			getByTestId(`view-atoms`)
			getByTestId(`view-selectors`)
			getByTestId(`view-transactions`)
			getByTestId(`view-timelines`)

			getByTestId(`state-index`)
			await waitFor(() => getByTestId(`state-letter`))
			await waitFor(() => getByTestId(`state-selections`))
		})

		act(() => {
			getByTestId(`open-close-state-letter`).click()
		})
		act(() => {
			getByTestId(`open-close-state-letter`).click()
		})
		act(() => {
			getByTestId(`open-close-state-family-count`).click()
		})
		act(() => {
			getByTestId(`open-close-state-count("count")`).click()
		})
		act(() => {
			getByTestId(`open-close-state-array`).click()
		})
		act(() => {
			getByTestId(`open-close-state-selections`).click()
		})
		act(() => {
			getByTestId(`open-close-state-myNull`).click()
		})
		act(() => {
			getByTestId(`open-close-state-myUndefined`).click()
		})

		act(() => {
			getByTestId(`open-close-state-myBoolean`).click()
		})

		act(() => {
			getByTestId(`view-selectors`).click()
		})
		await waitFor(() => getByTestId(`state-doubleLetter`))
		act(() => {
			getByTestId(`state-selectionsWithoutGreen`).click()
		})
		act(() => {
			getByTestId(`view-transactions`).click()
		})
		$.runTransaction(setLetterTX)(`C`)
		await waitFor(() => getByTestId(`transaction-setLetter`))
		act(() => {
			getByTestId(`open-close-transaction-setLetter`).click()
		})
		await waitFor(() => getByTestId(`transaction-update-setLetter-0`))
		act(() => {
			getByTestId(`view-timelines`).click()
		})
		await waitFor(() => getByTestId(`timeline-letterTL`))
		act(() => {
			getByTestId(`open-close-timeline-letterTL`).click()
		})
		await waitFor(() => getByTestId(`timeline-update-letter-0`))
	})
})

describe(`react-devtools`, () => {
	const scenario = () => {
		const letterState = $.atom<string>({
			key: `letter`,
			default: `A`,
		})
		const doubleLetterState = $.selector<string>({
			key: `doubleLetter`,
			get: ({ get }) => get(letterState) + get(letterState),
		})
		const setLetterTX = $.transaction<(newLetter: string) => void>({
			key: `setLetter`,
			do: ({ set }, newLetter) => {
				set(letterState, newLetter)
			},
		})
		const letterTL = $.timeline({
			key: `letterTL`,
			scope: [letterState],
		})
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
		const countAtoms = $.atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		const countAtom = $.findState(countAtoms, `count`)

		const arrayAtom = $.atom<string[]>({
			key: `array`,
			default: [`A`, `B`, `C`],
		})

		const myNullAtom = $.atom<null>({
			key: `myNull`,
			default: null,
		})

		const myUndefinedAtom = $.atom<undefined>({
			key: `myUndefined`,
			default: undefined,
		})

		const myBooleanAtom = $.atom<boolean>({
			key: `myBoolean`,
			default: false,
		})

		const Letter: FC = () => {
			const setLetter = AR.useI(letterState)
			const letter = AR.useO(letterState)
			return (
				<>
					<div data-testid={letter}>{letter}</div>
					<button
						type="button"
						onClick={() => {
							setLetter(`B`)
						}}
						data-testid="changeStateButton"
					/>
				</>
			)
		}
		const utils = render(
			<AR.StoreProvider store={$.store}>
				<Letter />
				<AtomIODevtools />
			</AR.StoreProvider>,
		)
		return { setLetterTX, ...utils }
	}
	it(`shows states`, async () => {
		const { setLetterTX, getByTestId, debug } = scenario()
		act(() => {
			const changeStateButton = getByTestId(`changeStateButton`)
			fireEvent.click(changeStateButton)
		})
		const option = getByTestId(`B`)

		await act(async () => {
			getByTestId(`view-atoms`)
			getByTestId(`view-selectors`)
			getByTestId(`view-transactions`)
			getByTestId(`view-timelines`)

			getByTestId(`state-index`)
			await waitFor(() => getByTestId(`state-letter`))
			await waitFor(() => getByTestId(`state-selections`))
		})

		act(() => {
			getByTestId(`open-close-state-letter`).click()
		})
		act(() => {
			getByTestId(`open-close-state-letter`).click()
		})
		act(() => {
			getByTestId(`open-close-state-family-count`).click()
		})
		act(() => {
			getByTestId(`open-close-state-count("count")`).click()
		})
		act(() => {
			getByTestId(`open-close-state-array`).click()
		})
		act(() => {
			getByTestId(`open-close-state-selections`).click()
		})
		act(() => {
			getByTestId(`open-close-state-myNull`).click()
		})
		act(() => {
			getByTestId(`open-close-state-myUndefined`).click()
		})

		act(() => {
			getByTestId(`open-close-state-myBoolean`).click()
		})

		act(() => {
			getByTestId(`view-selectors`).click()
		})
		await waitFor(() => getByTestId(`state-doubleLetter`))
		act(() => {
			getByTestId(`state-selectionsWithoutGreen`).click()
		})
		act(() => {
			getByTestId(`view-transactions`).click()
		})
		$.runTransaction(setLetterTX)(`C`)
		await waitFor(() => getByTestId(`transaction-setLetter`))
		act(() => {
			getByTestId(`open-close-transaction-setLetter`).click()
		})
		await waitFor(() => getByTestId(`transaction-update-setLetter-0`))
		act(() => {
			getByTestId(`view-timelines`).click()
		})
		await waitFor(() => getByTestId(`timeline-letterTL`))
		act(() => {
			getByTestId(`open-close-timeline-letterTL`).click()
		})
		await waitFor(() => getByTestId(`timeline-update-letter-0`))
	})
})
