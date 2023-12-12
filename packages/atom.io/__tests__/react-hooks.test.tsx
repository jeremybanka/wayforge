import { act, fireEvent, render } from "@testing-library/react"
import * as Internal from "atom.io/internal"
import * as AR from "atom.io/react"
import type { FC } from "react"

import type { Logger, TimelineToken, ƒn } from "atom.io"
import { atom, redo, selector, timeline, undo } from "atom.io"
import * as Utils from "./__util__"

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

describe(`single atom`, () => {
	const setters: ƒn[] = []
	const scenario = () => {
		const letterState = atom<string>({
			key: `letter`,
			default: `A`,
		})
		const Letter: FC = () => {
			const setLetter = AR.useI(letterState)
			const letter = AR.useO(letterState)
			setters.push(setLetter)
			return (
				<>
					<div data-testid={letter}>{letter}</div>
					<button
						type="button"
						onClick={() => setLetter(`B`)}
						data-testid="changeStateButton"
					/>
				</>
			)
		}
		const utils = render(
			<AR.StoreProvider>
				<Utils.Observer node={letterState} onChange={onChange} />
				<Letter />
			</AR.StoreProvider>,
		)
		return { ...utils }
	}

	it(`accepts user input with externally managed state`, () => {
		const { getByTestId } = scenario()
		const changeStateButton = getByTestId(`changeStateButton`)
		fireEvent.click(changeStateButton)
		const option = getByTestId(`B`)
		expect(option).toBeTruthy()
		expect(setters.length).toBe(2)
		expect(setters[0]).toBe(setters[1])
	})
})
describe(`timeline`, () => {
	const setters: ƒn[] = []
	const scenario = () => {
		const letterState = atom<string>({
			key: `letter`,
			default: `A`,
		})
		const letterTL = timeline({
			key: `letterTL`,
			atoms: [letterState],
		})
		const Letter: FC = () => {
			const setLetter = AR.useI(letterState)
			const letter = AR.useO(letterState)
			const letterTimeline = AR.useTL(letterTL)
			setters.push(setLetter)
			return (
				<>
					<div data-testid={letter}>{letter}</div>
					<div data-testid="timelineAt">{letterTimeline.at}</div>
					<div data-testid="timelineLength">{letterTimeline.length}</div>
					<button
						type="button"
						onClick={() => setLetter(`B`)}
						data-testid="changeStateButtonB"
					/>
					<button
						type="button"
						onClick={() => setLetter(`C`)}
						data-testid="changeStateButtonC"
					/>
					<button
						type="button"
						onClick={() => letterTimeline.undo()}
						data-testid="undoButton"
					/>
					<button
						type="button"
						onClick={() => letterTimeline.redo()}
						data-testid="redoButton"
					/>
				</>
			)
		}
		const utils = render(
			<AR.StoreProvider>
				<Utils.Observer node={letterState} onChange={onChange} />
				<Letter />
			</AR.StoreProvider>,
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
			atoms: [letterState],
		})
		const numberTL = timeline({
			key: `numberTL`,
			atoms: [numberState],
		})
		const whichTimelineState = atom<string>({
			key: `whichTimeline`,
			default: `letter`,
		})
		const timelineState = selector<TimelineToken>({
			key: `timeline`,
			get: ({ get }) => {
				const whichTimeline = get(whichTimelineState)
				return whichTimeline === `letter` ? letterTL : numberTL
			},
		})
		const Letter: FC = () => {
			const setLetter = AR.useI(letterState)
			const setNumber = AR.useI(numberState)
			const setWhichTimeline = AR.useI(whichTimelineState)
			const letter = AR.useO(letterState)
			const number = AR.useO(numberState)
			const timeline = AR.useTL(AR.useO(timelineState))
			return (
				<>
					<div data-testid={letter}>{letter}</div>
					<div data-testid={number}>{number}</div>
					<div data-testid="timelineAt">{timeline.at}</div>
					<div data-testid="timelineLength">{timeline.length}</div>
					<button
						type="button"
						onClick={() => setLetter(`B`)}
						data-testid="changeLetterButtonB"
					/>
					<button
						type="button"
						onClick={() => setNumber(2)}
						data-testid="changeNumberButton2"
					/>
					<button
						type="button"
						onClick={() =>
							setWhichTimeline((current) =>
								current === `number` ? `letter` : `number`,
							)
						}
						data-testid="changeTimelineButton"
					/>
					<button
						type="button"
						onClick={() => timeline.undo()}
						data-testid="undoButton"
					/>
					<button
						type="button"
						onClick={() => timeline.redo()}
						data-testid="redoButton"
					/>
				</>
			)
		}
		const utils = render(
			<AR.StoreProvider>
				<Utils.Observer node={letterState} onChange={onChange} />
				<Letter />
			</AR.StoreProvider>,
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
