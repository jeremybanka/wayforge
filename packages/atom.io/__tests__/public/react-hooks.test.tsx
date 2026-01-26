import { act, fireEvent, render } from "@testing-library/react"
import type { Loadable, Logger, TimelineToken } from "atom.io"
import {
	atom,
	atomFamily,
	getState,
	mutableAtom,
	redo,
	resetState,
	selector,
	setState,
	timeline,
	undo,
} from "atom.io"
import type { Fn } from "atom.io/internal"
import { clearStore, IMPLICIT } from "atom.io/internal"
import * as AR from "atom.io/react"
import { UList } from "atom.io/transceivers/u-list"
import { type FC, useEffect, useRef } from "react"

import * as Utils from "../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 3

let logger: Logger

beforeEach(() => {
	clearStore(IMPLICIT.STORE)
	IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = IMPLICIT.STORE.logger //= Utils.createNullLogger()
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(Utils, `stdout`)
})
const onChange = [() => undefined, console.log][0]

describe(`regular atom`, () => {
	const setters: Fn[] = []
	const scenario = () => {
		const letterAtom = atom<string>({
			key: `letter`,
			default: `A`,
		})
		const Letter: FC = () => {
			const setLetter = AR.useI(letterAtom)
			const letter = AR.useO(letterAtom)
			setters.push(setLetter)
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
			<AR.StoreProvider>
				<Utils.Observer node={letterAtom} onChange={onChange} />
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
		assert(option)
		expect(setters.length).toBe(2)
		expect(setters[0]).toBe(setters[1])
	})
})
describe(`mutable atom`, () => {
	const setters: Fn[] = []
	const scenario = () => {
		const lettersAtom = mutableAtom<UList<string>>({
			key: `letters`,
			class: UList,
		})
		const Letter: FC = () => {
			const setLetter = AR.useI(lettersAtom)
			const letters = AR.useO(lettersAtom)
			setters.push(setLetter)
			const includesA = letters.has(`A`) ? `yes` : `no`
			return (
				<>
					<div data-testid={includesA} />
					<button
						type="button"
						onClick={() => {
							setLetter((self) => self.add(`A`))
						}}
						data-testid="changeStateButton"
					/>
				</>
			)
		}
		const utils = render(
			<AR.StoreProvider>
				<Utils.Observer node={lettersAtom} onChange={onChange} />
				<Letter />
			</AR.StoreProvider>,
		)
		return { ...utils }
	}

	it(`accepts user input with externally managed state`, () => {
		const { getByTestId } = scenario()
		const changeStateButton = getByTestId(`changeStateButton`)
		fireEvent.click(changeStateButton)
		const option = getByTestId(`yes`)
		assert(option)
		expect(setters.length).toBe(2)
		expect(setters[0]).toBe(setters[1])
	})
})
describe(`timeline`, () => {
	const setters: Fn[] = []
	const scenario = () => {
		const letterAtom = atom<string>({
			key: `letter`,
			default: `A`,
		})
		const letterTL = timeline({
			key: `letterTL`,
			scope: [letterAtom],
		})
		const Letter: FC = () => {
			const setLetter = AR.useI(letterAtom)
			const letter = AR.useO(letterAtom)
			const letterTimeline = AR.useTL(letterTL)
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
			<AR.StoreProvider>
				<Utils.Observer node={letterAtom} onChange={onChange} />
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
		assert(option)
		const timelineAt = getByTestId(`timelineAt`)
		expect(timelineAt.textContent).toEqual(`1`)
		const timelineLength = getByTestId(`timelineLength`)
		expect(timelineLength.textContent).toEqual(`1`)
		fireEvent.click(changeStateButtonC)
		const option2 = getByTestId(`C`)
		assert(option2)
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
		const letterAtom = atom<string>({
			key: `letter`,
			default: `A`,
		})
		const numberAtom = atom<number>({
			key: `number`,
			default: 1,
		})
		const letterTL = timeline({
			key: `letterTL`,
			scope: [letterAtom],
		})
		const numberTL = timeline({
			key: `numberTL`,
			scope: [numberAtom],
		})
		const whichTimelineAtom = atom<string>({
			key: `whichTimeline`,
			default: `letter`,
		})
		const timelineSelector = selector<TimelineToken<unknown>>({
			key: `timeline`,
			get: ({ get }) => {
				const whichTimeline = get(whichTimelineAtom)
				return whichTimeline === `letter` ? letterTL : numberTL
			},
		})
		const Letter: FC = () => {
			const setLetter = AR.useI(letterAtom)
			const setNumber = AR.useI(numberAtom)
			const setWhichTimeline = AR.useI(whichTimelineAtom)
			const letter = AR.useO(letterAtom)
			const number = AR.useO(numberAtom)
			const tl = AR.useTL(AR.useO(timelineSelector))
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
			<AR.StoreProvider>
				<Utils.Observer node={letterAtom} onChange={onChange} />
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
		assert(option)
		expect(timelineAt.textContent).toEqual(`1`)
		expect(timelineLength.textContent).toEqual(`1`)
		fireEvent.click(changeTimelineButton)
		expect(timelineAt.textContent).toEqual(`0`)
		expect(timelineLength.textContent).toEqual(`0`)
		fireEvent.click(changeNumberButton2)
		const option2 = getByTestId(`2`)
		assert(option2)
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

describe(`useLoadable`, () => {
	test(`standalone, without a fallback`, async () => {
		let loadLetter = (_: string) => {
			console.warn(`loadLetter not attached`)
		}

		const letterAtom = atom<Loadable<string>>({
			key: `letter`,
			default: () =>
				new Promise((resolve) => {
					loadLetter = (letter: string) => {
						resolve(letter)
					}
				}),
		})

		const Letter: FC = () => {
			const letter = AR.useLoadable(letterAtom)
			if (letter === `LOADING`) {
				return (
					<div data-testid="loading">
						<div>Loading...</div>
					</div>
				)
			}
			return (
				<div data-testid="not-loading">
					<div data-testid={letter.value}>{letter.value}</div>
				</div>
			)
		}
		const utils = render(
			<AR.StoreProvider>
				<Letter />
			</AR.StoreProvider>,
		)
		assert(utils.getByTestId(`loading`))
		await act(async () => {
			loadLetter(`A`)
			await new Promise((resolve) => setImmediate(resolve))
		})
		assert(utils.getByTestId(`not-loading`))
		assert(utils.getByTestId(`A`))
	})
	test(`standalone, with a fallback`, async () => {
		let loadLetter = (_: string) => {
			console.warn(`loadLetter not attached`)
		}

		const letterAtom = atom<Loadable<string>>({
			key: `letter`,
			default: () =>
				new Promise((resolve) => {
					loadLetter = (letter: string) => {
						resolve(letter)
					}
				}),
		})

		const Letter: FC = () => {
			const letter = AR.useLoadable(letterAtom, `Z`)
			return (
				<div data-testid={letter.loading ? `loading` : `not-loading`}>
					<div data-testid={letter.value}>{letter.value}</div>
				</div>
			)
		}
		const utils = render(
			<AR.StoreProvider>
				<Letter />
			</AR.StoreProvider>,
		)
		assert(utils.getByTestId(`loading`))
		assert(utils.getByTestId(`Z`))
		await act(async () => {
			loadLetter(`A`)
			await new Promise((resolve) => setImmediate(resolve))
		})
		assert(utils.getByTestId(`not-loading`))
		assert(utils.getByTestId(`A`))
	})

	test(`family, without a fallback`, async () => {
		const loadIndex: Record<number, () => void> = {}

		const indexAtoms = atomFamily<Loadable<number[]>, number>({
			key: `index`,
			default: (key) =>
				new Promise((resolve) => {
					loadIndex[key] = () => {
						resolve([1, 2, 3])
					}
				}),
		})

		const Letter: FC = () => {
			const ids = AR.useLoadable(indexAtoms, 0)
			if (ids === `LOADING`) {
				return (
					<div data-testid="loading">
						<div>Loading...</div>
					</div>
				)
			}
			return (
				<div data-testid="not-loading">
					{ids.value.map((id) => (
						<div key={id} data-testid={id}>
							{id}
						</div>
					))}
				</div>
			)
		}
		const utils = render(
			<AR.StoreProvider>
				<Letter />
			</AR.StoreProvider>,
		)
		assert(utils.getByTestId(`loading`))
		await act(async () => {
			loadIndex[0]()
			await new Promise((resolve) => setImmediate(resolve))
		})
		assert(utils.getByTestId(`not-loading`))
		assert(utils.getByTestId(`1`))
		assert(utils.getByTestId(`2`))
		assert(utils.getByTestId(`3`))
	})
	test(`family, with a fallback`, async () => {
		const loadIndex: Record<number, () => void> = {}

		const indexAtoms = atomFamily<Loadable<number[]>, number>({
			key: `index`,
			default: (key) =>
				new Promise((resolve) => {
					loadIndex[key] = () => {
						resolve([1, 2, 3])
					}
				}),
		})

		const Letter: FC = () => {
			const ids = AR.useLoadable(indexAtoms, 0, [4, 5, 6])
			return (
				<div data-testid={ids.loading ? `loading` : `not-loading`}>
					{ids.value.map((id) => (
						<div key={id} data-testid={id}>
							{id}
						</div>
					))}
				</div>
			)
		}
		const utils = render(
			<AR.StoreProvider>
				<Letter />
			</AR.StoreProvider>,
		)
		assert(utils.getByTestId(`loading`))
		await act(async () => {
			loadIndex[0]()
			await new Promise((resolve) => setImmediate(resolve))
		})
		assert(utils.getByTestId(`not-loading`))
		assert(utils.getByTestId(`1`))
		assert(utils.getByTestId(`2`))
		assert(utils.getByTestId(`3`))
	})

	test(`family, without a fallback, with an error`, async () => {
		const loadIndex: Record<number, () => void> = {}
		const failIndex: Record<number, () => void> = {}
		let throwImmediately = false
		let resolveImmediately = false

		const indexAtoms = atomFamily<Loadable<number[]>, number, Error>({
			key: `index`,
			default: (key) => {
				if (resolveImmediately) {
					return [1, 2, 3]
				}
				if (throwImmediately) {
					throw new Error(`💥`)
				}
				return new Promise((resolve, reject) => {
					loadIndex[key] = () => {
						resolve([1, 2, 3])
					}
					failIndex[key] = () => {
						reject(new Error(`💥`))
					}
				})
			},
			catch: [Error],
		})

		const Letter: FC = () => {
			const ids = AR.useLoadable(indexAtoms, 0)
			if (ids === `LOADING`) {
				return (
					<div data-testid="loading">
						<div>Loading...</div>
					</div>
				)
			}
			if (ids.value instanceof Error) {
				return (
					<div data-testid={ids.loading ? `reloading` : `not-loading`}>
						<div data-testid="error">
							<div>Error...</div>
						</div>
					</div>
				)
			}
			return (
				<div data-testid={ids.loading ? `reloading` : `not-loading`}>
					{ids.value.map((id) => (
						<div key={id} data-testid={id}>
							{id}
						</div>
					))}
				</div>
			)
		}
		const utils = render(
			<AR.StoreProvider>
				<Letter />
			</AR.StoreProvider>,
		)
		assert(utils.getByTestId(`loading`))
		await act(async () => {
			failIndex[0]()
			await new Promise((resolve) => setImmediate(resolve))
		})

		assert(utils.getByTestId(`not-loading`))
		assert(utils.getByTestId(`error`))

		act(() => {
			resetState(indexAtoms, 0)
		})
		assert(utils.getByTestId(`reloading`))

		await act(async () => {
			loadIndex[0]()
			await new Promise((resolve) => setImmediate(resolve))
		})

		assert(utils.getByTestId(`not-loading`))
		expect(() => utils.getByTestId(`error`)).toThrowError()
		assert(utils.getByTestId(`1`))
		assert(utils.getByTestId(`2`))
		assert(utils.getByTestId(`3`))

		throwImmediately = true
		act(() => {
			resetState(indexAtoms, 0)
		})

		assert(utils.getByTestId(`not-loading`))
		assert(utils.getByTestId(`error`))

		resolveImmediately = true
		act(() => {
			resetState(indexAtoms, 0)
		})

		assert(utils.getByTestId(`not-loading`))
		expect(() => utils.getByTestId(`error`)).toThrowError()
		assert(utils.getByTestId(`1`))
		assert(utils.getByTestId(`2`))
		assert(utils.getByTestId(`3`))
	})

	test(`family, with a fallback, with an error`, async () => {
		const loadIndex: Record<number, () => void> = {}
		const failIndex: Record<number, () => void> = {}
		let throwImmediately = false
		let resolveImmediately = false

		const indexAtoms = atomFamily<Loadable<number[]>, number, Error>({
			key: `index`,
			default: (key) => {
				if (resolveImmediately) {
					return [1, 2, 3]
				}
				if (throwImmediately) {
					throw new Error(`💥`)
				}
				return new Promise((resolve, reject) => {
					loadIndex[key] = () => {
						resolve([1, 2, 3])
					}
					failIndex[key] = () => {
						reject(new Error(`💥`))
					}
				})
			},
			catch: [Error],
		})

		const Letter: FC = () => {
			const ids = AR.useLoadable(indexAtoms, 0, [4, 5, 6])
			return (
				<div data-testid={ids.loading ? `loading` : `not-loading`}>
					{ids.error ? <div data-testid="error">{ids.error.message}</div> : null}
					{ids.value.map((id) => (
						<div key={id} data-testid={id}>
							{id}
						</div>
					))}
				</div>
			)
		}
		const utils = render(
			<AR.StoreProvider>
				<Letter />
			</AR.StoreProvider>,
		)
		assert(utils.getByTestId(`loading`))
		await act(async () => {
			failIndex[0]()
			await new Promise((resolve) => setImmediate(resolve))
		})

		assert(utils.getByTestId(`not-loading`))
		assert(utils.getByTestId(`error`))
		assert(utils.getByTestId(`4`))
		assert(utils.getByTestId(`5`))
		assert(utils.getByTestId(`6`))

		act(() => {
			resetState(indexAtoms, 0)
		})
		assert(utils.getByTestId(`loading`))
		assert(utils.getByTestId(`4`))
		assert(utils.getByTestId(`5`))
		assert(utils.getByTestId(`6`))

		await act(async () => {
			loadIndex[0]()
			await new Promise((resolve) => setImmediate(resolve))
		})

		assert(utils.getByTestId(`not-loading`))
		expect(() => utils.getByTestId(`error`)).toThrowError()
		assert(utils.getByTestId(`1`))
		assert(utils.getByTestId(`2`))
		assert(utils.getByTestId(`3`))

		throwImmediately = true
		act(() => {
			resetState(indexAtoms, 0)
		})

		assert(utils.getByTestId(`not-loading`))
		assert(utils.getByTestId(`error`))
		assert(utils.getByTestId(`4`))
		assert(utils.getByTestId(`5`))
		assert(utils.getByTestId(`6`))

		resolveImmediately = true
		act(() => {
			resetState(indexAtoms, 0)
		})

		assert(utils.getByTestId(`not-loading`))
		expect(() => utils.getByTestId(`error`)).toThrowError()
		assert(utils.getByTestId(`1`))
		assert(utils.getByTestId(`2`))
		assert(utils.getByTestId(`3`))
	})

	test(`referential identity`, async () => {
		const uniqueRefs: unknown[] = []
		const promises: Promise<string>[] = []
		const loaders: ((letter: string) => void)[] = []
		function loadLetter(...params: string[]) {
			for (const letter of params) {
				// biome-ignore lint/style/noNonNullAssertion: test will fail
				loaders.shift()!(letter)
			}
		}

		const letterAtom = atom<Loadable<string>, Error>({
			key: `letter`,
			default: () => {
				const promise = new Promise<string>((resolve) => {
					loaders.push((letter: string) => {
						resolve(letter)
					})
				})
				promises.push(promise)
				return promise
			},
			catch: [Error],
		})

		const Letter: FC = () => {
			const letter = AR.useLoadable(letterAtom)

			useEffect(() => {
				uniqueRefs.push(letter)
			}, [letter])

			if (letter === `LOADING`) {
				return (
					<div data-testid="loading">
						<div>Loading...</div>
					</div>
				)
			}
			return (
				<div data-testid={letter.loading ? `loading` : `not-loading`}>
					{letter.value instanceof Error ? (
						<div data-testid="error">{letter.value.message}</div>
					) : (
						<div data-testid={letter.value}>{letter.value}</div>
					)}
				</div>
			)
		}

		const utils = render(
			<AR.StoreProvider>
				<Letter />
			</AR.StoreProvider>,
		)
		assert(utils.getByTestId(`loading`))
		expect(uniqueRefs).toHaveLength(1)
		await act(async () => {
			loadLetter(`A`)
			// console.log(`📝 loadLetter "A"`)
			await new Promise((resolve) => setImmediate(resolve))
		})
		assert(utils.getByTestId(`not-loading`))
		assert(utils.getByTestId(`A`))
		expect(uniqueRefs).toHaveLength(2)
		await act(async () => {
			resetState(letterAtom)
			resetState(letterAtom)
			// console.log(`📝 resetState`)
			await new Promise((resolve) => setImmediate(resolve))
		})
		assert(utils.getByTestId(`loading`))
		assert(utils.getByTestId(`A`))

		expect(uniqueRefs).toHaveLength(3)
		await act(async () => {
			// console.log(`📝 loadLetter "B", "C"`)
			loadLetter(``, `C`)
			await new Promise((resolve) => setImmediate(resolve))
		})
		assert(utils.getByTestId(`not-loading`))
		assert(utils.getByTestId(`C`))
		expect(uniqueRefs).toHaveLength(4)
		await act(async () => {
			setState(letterAtom, `D`)
			// console.log(`📝 resetState`)
			await new Promise((resolve) => setImmediate(resolve))
		})
		assert(utils.getByTestId(`not-loading`))
		assert(utils.getByTestId(`D`))
		expect(uniqueRefs).toHaveLength(4)
		// /* ^ ❗ I don't have an opinion on this yet ❗ ^ */
	})
})

describe(`useAtomicRef`, () => {
	it(`makes an element available to use wherever`, () => {
		const buttonAtom = atom<HTMLButtonElement | null>({
			key: `button`,
			default: null,
		})
		function MyButton() {
			const ref = AR.useAtomicRef(buttonAtom, useRef)
			return (
				<button
					type="button"
					ref={ref}
					onClick={() => {
						Utils.stdout(`hi`)
					}}
				>
					Click me
				</button>
			)
		}
		render(<MyButton />)

		getState(buttonAtom)?.click()

		expect(Utils.stdout).toHaveBeenCalledWith(`hi`)
	})
})
