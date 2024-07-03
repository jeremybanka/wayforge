/** @jsxImportSource solid-js */
/** @jsx preserve */
/** @jsxFrag Fragment */

import { fireEvent, prettyDOM, render } from "@solidjs/testing-library"
import type { Logger, TimelineToken } from "atom.io"
import { atom, redo, selector, timeline, undo } from "atom.io"
import * as Internal from "atom.io/internal"
import * as AS from "atom.io/solid"
import type { JSX } from "solid-js"

import * as Utils from "../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 2

let logger: Logger

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = Internal.IMPLICIT.STORE.logger
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(Utils, `stdout`)
})
const onChange = [() => undefined, console.log][0]

describe.only(`single atom`, () => {
	const setters: Internal.Func[] = []
	const scenario = () => {
		const letterState = atom<string>({
			key: `letter`,
			default: `A`,
		})
		function Letter(): JSX.Element {
			const setLetter = AS.useI(letterState)
			const letter = AS.useO(letterState)
			setters.push(setLetter)
			return (
				<div>
					<div data-testid={letter()}>{letter()}</div>
					<button
						type="button"
						onClick={() => {
							setLetter(`B`)
						}}
						data-testid="changeStateButton"
					/>
				</div>
			)
		}
		const utils = render(() => (
			<AS.StoreProvider>
				<Letter />
			</AS.StoreProvider>
		))
		console.log(prettyDOM(document))
		return { ...utils }
	}

	it(`accepts user input with externally managed state`, () => {
		const { getByTestId } = scenario()
		const changeStateButton = getByTestId(`changeStateButton`)
		fireEvent.click(changeStateButton)
		const option = getByTestId(`B`)
		expect(option).toBeTruthy()
		expect(setters.length).toBe(1)
	})
})
describe(`timeline`, () => {
	const setters: Internal.Func[] = []
	const scenario = () => {
		const letterState = atom<string>({
			key: `letter`,
			default: `A`,
		})
		const letterTL = timeline({
			key: `letterTL`,
			scope: [letterState],
		})
		const Letter: FC = () => {
			const setLetter = AS.useI(letterState)
			const letter = AS.useO(letterState)
			const letterTimeline = AS.useTL(letterTL)
			setters.push(setLetter)
			return (
				<>
					<div data-testid={letter}>{letter}</div>
					<div data-testid="timelineAt">{letterTimeline.at}</div>
					<div data-testid="timelineLength">{letterTimeline.length}</div>
					<button
						type="button"
						onClick={() => {
							setLetter(`B`)
						}}
						data-testid="changeStateButtonB"
					/>
					<button
						type="button"
						onClick={() => {
							setLetter(`C`)
						}}
						data-testid="changeStateButtonC"
					/>
					<button
						type="button"
						onClick={() => {
							letterTimeline.undo()
						}}
						data-testid="undoButton"
					/>
					<button
						type="button"
						onClick={() => {
							letterTimeline.redo()
						}}
						data-testid="redoButton"
					/>
				</>
			)
		}
		const utils = render(
			<AS.StoreProvider>
				<Utils.Observer node={letterState} onChange={onChange} />
				<Letter />
			</AS.StoreProvider>,
		)
		return { ...utils, letterTL }
	}

	it(`displays metadata`, () => {
		const { getByTestId, letterTL } = scenario()
		const changeStateButtonB = getByTestId(`changeStateButtonB`)
		const changeStateButtonC = getByTestId(`changeStateButtonC`)
		fireEvent.click(changeStateButtonB)
		const option = getByTestId(`B`)
		expect(option).toBeTruthy()
		const timelineAt = getByTestId(`timelineAt`)
		expect(timelineAt.textContent).toEqual(`1`)
		const timelineLength = getByTestId(`timelineLength`)
		expect(timelineLength.textContent).toEqual(`1`)
		fireEvent.click(changeStateButtonC)
		const option2 = getByTestId(`C`)
		expect(option2).toBeTruthy()
		expect(timelineAt.textContent).toEqual(`2`)
		act(() => {
			undo(letterTL)
		})
		expect(timelineAt.textContent).toEqual(`1`)
		expect(timelineLength.textContent).toEqual(`2`)
		act(() => {
			redo(letterTL)
		})
		expect(timelineAt.textContent).toEqual(`2`)
		expect(timelineLength.textContent).toEqual(`2`)
		const undoButton = getByTestId(`undoButton`)
		fireEvent.click(undoButton)
		expect(timelineAt.textContent).toEqual(`1`)
		expect(timelineLength.textContent).toEqual(`2`)
		const redoButton = getByTestId(`redoButton`)
		fireEvent.click(redoButton)
		expect(timelineAt.textContent).toEqual(`2`)
		expect(timelineLength.textContent).toEqual(`2`)
	})
})
describe(`timeline (dynamic)`, () => {
	const scenario = () => {
		const letterState = atom<string>({
			key: `letter`,
			default: `A`,
		})
		const numberState = atom<number>({
			key: `number`,
			default: 1,
		})
		const letterTL = timeline({
			key: `letterTL`,
			scope: [letterState],
		})
		const numberTL = timeline({
			key: `numberTL`,
			scope: [numberState],
		})
		const whichTimelineState = atom<string>({
			key: `whichTimeline`,
			default: `letter`,
		})
		const timelineState = selector<TimelineToken<unknown>>({
			key: `timeline`,
			get: ({ get }) => {
				const whichTimeline = get(whichTimelineState)
				return whichTimeline === `letter` ? letterTL : numberTL
			},
		})
		const Letter: FC = () => {
			const setLetter = AS.useI(letterState)
			const setNumber = AS.useI(numberState)
			const setWhichTimeline = AS.useI(whichTimelineState)
			const letter = AS.useO(letterState)
			const number = AS.useO(numberState)
			const tl = AS.useTL(AS.useO(timelineState))
			return (
				<>
					<div data-testid={letter}>{letter}</div>
					<div data-testid={number}>{number}</div>
					<div data-testid="timelineAt">{tl.at}</div>
					<div data-testid="timelineLength">{tl.length}</div>
					<button
						type="button"
						onClick={() => {
							setLetter(`B`)
						}}
						data-testid="changeLetterButtonB"
					/>
					<button
						type="button"
						onClick={() => {
							setNumber(2)
						}}
						data-testid="changeNumberButton2"
					/>
					<button
						type="button"
						onClick={() => {
							setWhichTimeline((current) =>
								current === `number` ? `letter` : `number`,
							)
						}}
						data-testid="changeTimelineButton"
					/>
					<button
						type="button"
						onClick={() => {
							tl.undo()
						}}
						data-testid="undoButton"
					/>
					<button
						type="button"
						onClick={() => {
							tl.redo()
						}}
						data-testid="redoButton"
					/>
				</>
			)
		}
		const utils = render(
			<AS.StoreProvider>
				<Utils.Observer node={letterState} onChange={onChange} />
				<Letter />
			</AS.StoreProvider>,
		)
		return { ...utils, letterTL }
	}

	it(`displays metadata`, () => {
		const { getByTestId, letterTL } = scenario()
		const changeLetterButtonB = getByTestId(`changeLetterButtonB`)
		const changeNumberButton2 = getByTestId(`changeNumberButton2`)
		const changeTimelineButton = getByTestId(`changeTimelineButton`)
		const timelineAt = getByTestId(`timelineAt`)
		const timelineLength = getByTestId(`timelineLength`)
		fireEvent.click(changeLetterButtonB)
		const option = getByTestId(`B`)
		expect(option).toBeTruthy()
		expect(timelineAt.textContent).toEqual(`1`)
		expect(timelineLength.textContent).toEqual(`1`)
		fireEvent.click(changeTimelineButton)
		expect(timelineAt.textContent).toEqual(`0`)
		expect(timelineLength.textContent).toEqual(`0`)
		fireEvent.click(changeNumberButton2)
		const option2 = getByTestId(`2`)
		expect(option2).toBeTruthy()
		expect(timelineAt.textContent).toEqual(`1`)
		expect(timelineLength.textContent).toEqual(`1`)
		act(() => {
			undo(letterTL)
		})
		fireEvent.click(changeTimelineButton)
		expect(timelineAt.textContent).toEqual(`0`)
		expect(timelineLength.textContent).toEqual(`1`)
	})
})
