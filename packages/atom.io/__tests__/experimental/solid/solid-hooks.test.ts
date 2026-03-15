/* eslint-disable @typescript-eslint/no-shadow */ // need host on both sides
/** biome-ignore-all lint/correctness/useHookAtTopLevel: not react hooks */
import type { Loadable, TimelineToken } from "atom.io"
import {
	atom,
	atomFamily,
	getState,
	mutableAtom,
	mutableAtomFamily,
	redo,
	resetState,
	selector,
	setState,
	timeline,
	undo,
} from "atom.io"
import type { Fn } from "atom.io/internal"
import { clearStore, IMPLICIT } from "atom.io/internal"
import { UList } from "atom.io/transceivers/u-list"

import * as Utils from "../../__util__"

vi.mock(`solid-js`, async () => import(`solid-js/dist/solid.js`))

const flush = async (): Promise<void> => {
	await Promise.resolve()
}

const waitForAsyncState = async (): Promise<void> => {
	await new Promise((resolve) => setImmediate(resolve))
	await flush()
}

const getByTestId = (host: HTMLElement, testId: string): HTMLElement => {
	const found = host.querySelector<HTMLElement>(`[data-testid="${testId}"]`)
	if (!found) {
		throw new Error(`Could not find [data-testid="${testId}"]`)
	}
	return found
}

const queryByTestId = (host: HTMLElement, testId: string): HTMLElement | null =>
	host.querySelector<HTMLElement>(`[data-testid="${testId}"]`)

const createDisplay = (): HTMLDivElement => document.createElement(`div`)

const setDisplay = (
	element: HTMLElement,
	testId: string,
	textContent: string = testId,
): void => {
	element.dataset[`testid`] = testId
	element.textContent = textContent
}

const setContainerState = (container: HTMLElement, testId: string): void => {
	container.dataset[`testid`] = testId
}

const fillContainerWithIds = (
	container: HTMLElement,
	ids: readonly (number | string)[],
): void => {
	container.replaceChildren(
		...ids.map((id) => {
			const child = document.createElement(`div`)
			setDisplay(child, `${id}`)
			return child
		}),
	)
}

const createButton = (
	testId: string,
	onClick: () => void,
): HTMLButtonElement => {
	const button = document.createElement(`button`)
	button.type = `button`
	button.dataset[`testid`] = testId
	button.addEventListener(`click`, onClick)
	return button
}

const loadSolidIntegration = async () => {
	const Solid = await import(`solid-js`)
	const AS = await import(`atom.io/solid`)
	return { AS, Solid }
}

const makeButtonRef = <TT>(
	initialValue: TT | null,
): {
	current: HTMLButtonElement | null
} => ({
	current: initialValue as HTMLButtonElement | null,
})

const mountWithProvider = async (
	renderChildren: (
		ctx: Awaited<ReturnType<typeof loadSolidIntegration>> & {
			host: HTMLElement
		},
	) => void,
) => {
	const integration = await loadSolidIntegration()
	const { AS, Solid } = integration
	const host = document.createElement(`div`)
	document.body.append(host)
	let dispose: () => void = () => {}
	Solid.createRoot((rootDispose) => {
		dispose = rootDispose
		AS.StoreProvider({
			children: (() => {
				renderChildren({ ...integration, host })
				return undefined
			}) as unknown as never,
		})
	})
	await flush()
	return { ...integration, host, dispose }
}

const mountStandalone = async (
	renderChildren: (
		ctx: Awaited<ReturnType<typeof loadSolidIntegration>> & {
			host: HTMLElement
		},
	) => void,
) => {
	const integration = await loadSolidIntegration()
	const { Solid } = integration
	const host = document.createElement(`div`)
	document.body.append(host)
	let dispose: () => void = () => {}
	Solid.createRoot((rootDispose) => {
		dispose = rootDispose
		renderChildren({ ...integration, host })
	})
	await flush()
	return { ...integration, host, dispose }
}

beforeEach(() => {
	clearStore(IMPLICIT.STORE)
	vi.restoreAllMocks()
	vi.spyOn(Utils, `stdout`)
})

describe(`regular atom`, () => {
	const setters: Fn[] = []

	beforeEach(() => {
		setters.length = 0
	})

	const scenario = async () => {
		const letterAtom = atom<string>({
			key: `letter`,
			default: `A`,
		})
		const observed: string[] = []
		const mounted = await mountWithProvider(({ AS, Solid, host }) => {
			const Observer = () => {
				const value = AS.useO(letterAtom)
				Solid.createEffect(() => {
					observed.push(value())
				})
				return null
			}

			const Letter = () => {
				const setLetter = AS.useI(letterAtom)
				const letter = AS.useO(letterAtom)
				const root = document.createElement(`div`)
				const display = createDisplay()
				const button = createButton(`changeStateButton`, () => {
					setLetter(`B`)
				})
				root.append(display, button)
				Solid.createEffect(() => {
					const value = letter()
					setters.push(setLetter)
					setDisplay(display, value)
				})
				return root
			}

			Observer()
			host.append(Letter())
		})
		return { ...mounted, observed }
	}

	it(`accepts user input with externally managed state`, async () => {
		const { dispose, host, observed } = await scenario()
		getByTestId(host, `changeStateButton`).click()
		await flush()
		assert(getByTestId(host, `B`))
		expect(observed).toEqual([`A`, `B`])
		expect(setters.length).toBe(2)
		expect(setters[0]).toBe(setters[1])
		dispose()
		host.remove()
	})
})

describe(`mutable atom`, () => {
	const setters: Fn[] = []

	beforeEach(() => {
		setters.length = 0
	})

	const scenario = async () => {
		const lettersAtom = mutableAtom<UList<string>>({
			key: `letters`,
			class: UList,
		})
		const observed: string[] = []
		const mounted = await mountWithProvider(({ AS, Solid, host }) => {
			const Observer = () => {
				const value = AS.useO(lettersAtom)
				Solid.createEffect(() => {
					observed.push(value().has(`A`) ? `yes` : `no`)
				})
				return null
			}

			const Letter = () => {
				const setLetter = AS.useI(lettersAtom)
				const letters = AS.useO(lettersAtom)
				const root = document.createElement(`div`)
				const display = createDisplay()
				const button = createButton(`changeStateButton`, () => {
					setLetter((self) => self.add(`A`))
				})
				root.append(display, button)
				Solid.createEffect(() => {
					const value = letters()
					setters.push(setLetter)
					setDisplay(display, value.has(`A`) ? `yes` : `no`, ``)
				})
				return root
			}

			Observer()
			host.append(Letter())
		})
		return { ...mounted, observed }
	}

	it(`accepts user input with externally managed state`, async () => {
		const { dispose, host, observed } = await scenario()
		expect(observed).toEqual([`no`])
		getByTestId(host, `changeStateButton`).click()
		await flush()
		assert(getByTestId(host, `yes`))
		expect(observed).toEqual([`no`, `yes`])
		expect(setters.length).toBe(2)
		expect(setters[0]).toBe(setters[1])
		dispose()
		host.remove()
	})
})

describe(`timeline`, () => {
	const setters: Fn[] = []

	beforeEach(() => {
		setters.length = 0
	})

	const scenario = async () => {
		const letterAtom = atom<string>({
			key: `letter`,
			default: `A`,
		})
		const letterTL = timeline({
			key: `letterTL`,
			scope: [letterAtom],
		})
		const mounted = await mountWithProvider(({ AS, Solid, host }) => {
			const Observer = () => {
				const value = AS.useO(letterAtom)
				Solid.createEffect(() => {
					value()
				})
				return null
			}

			const Letter = () => {
				const setLetter = AS.useI(letterAtom)
				const letter = AS.useO(letterAtom)
				const letterTimeline = AS.useTL(letterTL)
				const root = document.createElement(`div`)
				const letterDisplay = createDisplay()
				const atDisplay = createDisplay()
				const lengthDisplay = createDisplay()
				root.append(
					letterDisplay,
					atDisplay,
					lengthDisplay,
					createButton(`changeStateButtonB`, () => {
						setLetter(`B`)
					}),
					createButton(`changeStateButtonC`, () => {
						setLetter(`C`)
					}),
					createButton(`undoButton`, () => {
						letterTimeline().undo()
					}),
					createButton(`redoButton`, () => {
						letterTimeline().redo()
					}),
				)
				Solid.createEffect(() => {
					const value = letter()
					const meta = letterTimeline()
					setters.push(setLetter)
					setDisplay(letterDisplay, value)
					setDisplay(atDisplay, `timelineAt`, `${meta.at}`)
					setDisplay(lengthDisplay, `timelineLength`, `${meta.length}`)
				})
				return root
			}

			Observer()
			host.append(Letter())
		})
		return { ...mounted, letterTL }
	}

	it(`displays metadata`, async () => {
		const { dispose, host, letterTL } = await scenario()
		getByTestId(host, `changeStateButtonB`).click()
		await flush()
		assert(getByTestId(host, `B`))
		const timelineAt = getByTestId(host, `timelineAt`)
		const timelineLength = getByTestId(host, `timelineLength`)
		expect(timelineAt.textContent).toEqual(`1`)
		expect(timelineLength.textContent).toEqual(`1`)
		getByTestId(host, `changeStateButtonC`).click()
		await flush()
		assert(getByTestId(host, `C`))
		expect(timelineAt.textContent).toEqual(`2`)
		undo(letterTL)
		await flush()
		expect(timelineAt.textContent).toEqual(`1`)
		expect(timelineLength.textContent).toEqual(`2`)
		redo(letterTL)
		await flush()
		expect(timelineAt.textContent).toEqual(`2`)
		expect(timelineLength.textContent).toEqual(`2`)
		getByTestId(host, `undoButton`).click()
		await flush()
		expect(timelineAt.textContent).toEqual(`1`)
		expect(timelineLength.textContent).toEqual(`2`)
		getByTestId(host, `redoButton`).click()
		await flush()
		expect(timelineAt.textContent).toEqual(`2`)
		expect(timelineLength.textContent).toEqual(`2`)
		dispose()
		host.remove()
	})
})

describe(`timeline (dynamic)`, () => {
	const scenario = async () => {
		const letterAtom = atom<string>({ key: `letter`, default: `A` })
		const numberAtom = atom<number>({ key: `number`, default: 1 })
		const letterTL = timeline({ key: `letterTL`, scope: [letterAtom] })
		const numberTL = timeline({ key: `numberTL`, scope: [numberAtom] })
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
		const mounted = await mountWithProvider(({ AS, Solid, host }) => {
			const Letter = () => {
				const setLetter = AS.useI(letterAtom)
				const setNumber = AS.useI(numberAtom)
				const setWhichTimeline = AS.useI(whichTimelineAtom)
				const letter = AS.useO(letterAtom)
				const number = AS.useO(numberAtom)
				const currentTimeline = AS.useO(timelineSelector)

				const root = document.createElement(`div`)
				const letterDisplay = createDisplay()
				const numberDisplay = createDisplay()
				const atDisplay = createDisplay()
				const lengthDisplay = createDisplay()
				let disposeTimeline: () => void = () => {}
				root.append(
					letterDisplay,
					numberDisplay,
					atDisplay,
					lengthDisplay,
					createButton(`changeLetterButtonB`, () => {
						setLetter(`B`)
					}),
					createButton(`changeNumberButton2`, () => {
						setNumber(2)
					}),
					createButton(`changeTimelineButton`, () => {
						setWhichTimeline((current) =>
							current === `number` ? `letter` : `number`,
						)
					}),
					createButton(`undoButton`, () => {
						const token = currentTimeline()
						undo(token)
					}),
					createButton(`redoButton`, () => {
						const token = currentTimeline()
						redo(token)
					}),
				)
				Solid.createEffect(() => {
					setDisplay(letterDisplay, `${letter()}`)
					setDisplay(numberDisplay, `${number()}`)
				})
				Solid.createEffect(() => {
					const token = currentTimeline()
					disposeTimeline()
					Solid.createRoot((innerDispose) => {
						disposeTimeline = innerDispose
						const tl = AS.useTL(token)
						Solid.createEffect(() => {
							const meta = tl()
							setDisplay(atDisplay, `timelineAt`, `${meta.at}`)
							setDisplay(lengthDisplay, `timelineLength`, `${meta.length}`)
						})
					})
				})
				Solid.onCleanup(() => {
					disposeTimeline()
				})
				return root
			}

			host.append(Letter())
		})
		return { ...mounted, letterTL }
	}

	it(`displays metadata`, async () => {
		const { dispose, host, letterTL } = await scenario()
		const timelineAt = getByTestId(host, `timelineAt`)
		const timelineLength = getByTestId(host, `timelineLength`)
		getByTestId(host, `changeLetterButtonB`).click()
		await flush()
		assert(getByTestId(host, `B`))
		expect(timelineAt.textContent).toEqual(`1`)
		expect(timelineLength.textContent).toEqual(`1`)
		getByTestId(host, `changeTimelineButton`).click()
		await flush()
		expect(timelineAt.textContent).toEqual(`0`)
		expect(timelineLength.textContent).toEqual(`0`)
		getByTestId(host, `changeNumberButton2`).click()
		await flush()
		assert(getByTestId(host, `2`))
		expect(timelineAt.textContent).toEqual(`1`)
		expect(timelineLength.textContent).toEqual(`1`)
		undo(letterTL)
		await flush()
		getByTestId(host, `changeTimelineButton`).click()
		await flush()
		expect(timelineAt.textContent).toEqual(`0`)
		expect(timelineLength.textContent).toEqual(`1`)
		dispose()
		host.remove()
	})
})

describe(`useLoadable`, () => {
	test(`standalone, immediately available without a fallback`, async () => {
		const letterAtom = atom<Loadable<string>>({
			key: `letter`,
			default: `A`,
		})
		const { dispose, host } = await mountWithProvider(({ AS, Solid, host }) => {
			const Letter = () => {
				const letter = AS.useLoadable(letterAtom)
				const root = document.createElement(`div`)
				const child = createDisplay()
				root.append(child)
				Solid.createEffect(() => {
					const value = letter()
					if (value === `LOADING`) {
						setContainerState(root, `loading`)
						return
					}
					setContainerState(root, value.loading ? `loading` : `not-loading`)
					setDisplay(child, `${value.value}`)
				})
				return root
			}
			host.append(Letter())
		})
		assert(getByTestId(host, `not-loading`))
		assert(getByTestId(host, `A`))
		dispose()
		host.remove()
	})

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
		const { dispose, host } = await mountWithProvider(({ AS, Solid, host }) => {
			const Letter = () => {
				const letter = AS.useLoadable(letterAtom)
				const root = document.createElement(`div`)
				const child = document.createElement(`div`)
				root.append(child)
				Solid.createEffect(() => {
					const value = letter()
					if (value === `LOADING`) {
						setContainerState(root, `loading`)
						child.removeAttribute(`data-testid`)
						child.textContent = `Loading...`
						return
					}
					setContainerState(root, `not-loading`)
					setDisplay(child, `${value.value}`)
				})
				return root
			}
			host.append(Letter())
		})
		assert(getByTestId(host, `loading`))
		loadLetter(`A`)
		await waitForAsyncState()
		assert(getByTestId(host, `not-loading`))
		assert(getByTestId(host, `A`))
		dispose()
		host.remove()
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
		const { dispose, host } = await mountWithProvider(({ AS, Solid, host }) => {
			const Letter = () => {
				const letter = AS.useLoadable(letterAtom, `Z`)
				const root = document.createElement(`div`)
				const child = createDisplay()
				root.append(child)
				Solid.createEffect(() => {
					const value = letter()
					setContainerState(root, value.loading ? `loading` : `not-loading`)
					setDisplay(child, `${value.value}`)
				})
				return root
			}
			host.append(Letter())
		})
		assert(getByTestId(host, `loading`))
		assert(getByTestId(host, `Z`))
		loadLetter(`A`)
		await waitForAsyncState()
		assert(getByTestId(host, `not-loading`))
		assert(getByTestId(host, `A`))
		dispose()
		host.remove()
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
		const { dispose, host } = await mountWithProvider(({ AS, Solid, host }) => {
			const Letter = (): HTMLDivElement => {
				const ids = AS.useLoadable(indexAtoms, 0)
				const root = document.createElement(`div`)
				Solid.createEffect(() => {
					const value = ids()
					if (value === `LOADING`) {
						setContainerState(root, `loading`)
						root.textContent = `Loading...`
						return
					}
					setContainerState(root, `not-loading`)
					fillContainerWithIds(root, value.value as number[])
				})
				return root
			}
			host.append(Letter())
		})
		assert(getByTestId(host, `loading`))
		loadIndex[0]()
		await waitForAsyncState()
		assert(getByTestId(host, `not-loading`))
		assert(getByTestId(host, `1`))
		assert(getByTestId(host, `2`))
		assert(getByTestId(host, `3`))
		dispose()
		host.remove()
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
		const { dispose, host } = await mountWithProvider(({ AS, Solid, host }) => {
			const Letter = () => {
				const ids = AS.useLoadable(indexAtoms, 0, [4, 5, 6])
				const root = document.createElement(`div`)
				Solid.createEffect(() => {
					const value = ids()
					setContainerState(root, value.loading ? `loading` : `not-loading`)
					fillContainerWithIds(root, value.value as number[])
				})
				return root
			}
			host.append(Letter())
		})
		assert(getByTestId(host, `loading`))
		loadIndex[0]()
		await waitForAsyncState()
		assert(getByTestId(host, `not-loading`))
		assert(getByTestId(host, `1`))
		assert(getByTestId(host, `2`))
		assert(getByTestId(host, `3`))
		dispose()
		host.remove()
	})

	test(`family, without a fallback, with an error`, async () => {
		const loadIndex: Record<number, () => void> = {}
		const failIndex: Record<number, () => void> = {}
		let throwImmediately = false
		let resolveImmediately = false
		const indexAtoms = atomFamily<Loadable<number[]>, number, Error>({
			key: `index`,
			default: (key) => {
				if (resolveImmediately) return [1, 2, 3]
				if (throwImmediately) throw new Error(`💥`)
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
		const { dispose, host } = await mountWithProvider(({ AS, Solid, host }) => {
			const Letter = () => {
				const ids = AS.useLoadable(indexAtoms, 0)
				const root = document.createElement(`div`)
				const error = createDisplay()
				root.append(error)
				Solid.createEffect(() => {
					const value = ids()
					if (value === `LOADING`) {
						setContainerState(root, `loading`)
						root.replaceChildren(error)
						error.removeAttribute(`data-testid`)
						error.textContent = `Loading...`
						return
					}
					setContainerState(root, value.loading ? `reloading` : `not-loading`)
					if (value.value instanceof Error) {
						root.replaceChildren(error)
						setDisplay(error, `error`, `Error...`)
						return
					}
					fillContainerWithIds(root, value.value as number[])
					if (value.loading) setContainerState(root, `reloading`)
				})
				return root
			}
			host.append(Letter())
		})
		assert(getByTestId(host, `loading`))
		failIndex[0]()
		await waitForAsyncState()
		assert(getByTestId(host, `not-loading`))
		assert(getByTestId(host, `error`))
		resetState(indexAtoms, 0)
		await flush()
		assert(getByTestId(host, `reloading`))
		loadIndex[0]()
		await waitForAsyncState()
		assert(getByTestId(host, `not-loading`))
		expect(queryByTestId(host, `error`)).toBeNull()
		assert(getByTestId(host, `1`))
		assert(getByTestId(host, `2`))
		assert(getByTestId(host, `3`))
		throwImmediately = true
		resetState(indexAtoms, 0)
		await flush()
		assert(getByTestId(host, `not-loading`))
		assert(getByTestId(host, `error`))
		resolveImmediately = true
		throwImmediately = false
		resetState(indexAtoms, 0)
		await flush()
		assert(getByTestId(host, `not-loading`))
		expect(queryByTestId(host, `error`)).toBeNull()
		assert(getByTestId(host, `1`))
		assert(getByTestId(host, `2`))
		assert(getByTestId(host, `3`))
		dispose()
		host.remove()
	})

	test(`family, with a fallback, with an error`, async () => {
		const loadIndex: Record<number, () => void> = {}
		const failIndex: Record<number, () => void> = {}
		let throwImmediately = false
		let resolveImmediately = false
		const indexAtoms = atomFamily<Loadable<number[]>, number, Error>({
			key: `index`,
			default: (key) => {
				if (resolveImmediately) return [1, 2, 3]
				if (throwImmediately) throw new Error(`💥`)
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
		const { dispose, host } = await mountWithProvider(({ AS, Solid, host }) => {
			const Letter = () => {
				const ids = AS.useLoadable(indexAtoms, 0, [4, 5, 6])
				const root = document.createElement(`div`)
				const error = createDisplay()
				root.append(error)
				Solid.createEffect(() => {
					const value = ids()
					setContainerState(root, value.loading ? `loading` : `not-loading`)
					const children: HTMLElement[] = []
					if (value.error) {
						setDisplay(error, `error`, `${value.error.message}`)
						children.push(error)
					}
					for (const id of value.value as number[]) {
						const child = document.createElement(`div`)
						setDisplay(child, `${id}`)
						children.push(child)
					}
					root.replaceChildren(...children)
					setContainerState(root, value.loading ? `loading` : `not-loading`)
				})
				return root
			}
			host.append(Letter())
		})
		assert(getByTestId(host, `loading`))
		failIndex[0]()
		await waitForAsyncState()
		assert(getByTestId(host, `not-loading`))
		assert(getByTestId(host, `error`))
		assert(getByTestId(host, `4`))
		assert(getByTestId(host, `5`))
		assert(getByTestId(host, `6`))
		resetState(indexAtoms, 0)
		await flush()
		assert(getByTestId(host, `loading`))
		assert(getByTestId(host, `4`))
		assert(getByTestId(host, `5`))
		assert(getByTestId(host, `6`))
		loadIndex[0]()
		await waitForAsyncState()
		assert(getByTestId(host, `not-loading`))
		expect(queryByTestId(host, `error`)).toBeNull()
		assert(getByTestId(host, `1`))
		assert(getByTestId(host, `2`))
		assert(getByTestId(host, `3`))
		throwImmediately = true
		resetState(indexAtoms, 0)
		await flush()
		assert(getByTestId(host, `not-loading`))
		assert(getByTestId(host, `error`))
		assert(getByTestId(host, `4`))
		assert(getByTestId(host, `5`))
		assert(getByTestId(host, `6`))
		resolveImmediately = true
		throwImmediately = false
		resetState(indexAtoms, 0)
		await flush()
		assert(getByTestId(host, `not-loading`))
		expect(queryByTestId(host, `error`)).toBeNull()
		assert(getByTestId(host, `1`))
		assert(getByTestId(host, `2`))
		assert(getByTestId(host, `3`))
		dispose()
		host.remove()
	})

	test(`preserves loading wrapper identity after an error when fallback is present`, async () => {
		const failIndex: Record<number, () => void> = {}
		const uniqueRefs: unknown[] = []
		const indexAtoms = atomFamily<Loadable<number[]>, number, Error>({
			key: `index`,
			default: (key) =>
				new Promise((_, reject) => {
					failIndex[key] = () => {
						reject(new Error(`💥`))
					}
				}),
			catch: [Error],
		})
		const { dispose, host } = await mountWithProvider(({ AS, Solid, host }) => {
			const Letter = () => {
				const ids = AS.useLoadable(indexAtoms, 0, [4, 5, 6])
				const stableIds = Solid.createMemo(() => ids())
				const root = document.createElement(`div`)
				Solid.createEffect(() => {
					uniqueRefs.push(stableIds())
				})
				Solid.createEffect(() => {
					const value = ids()
					setContainerState(root, value.loading ? `loading` : `not-loading`)
					fillContainerWithIds(root, value.value as number[])
				})
				return root
			}
			host.append(Letter())
		})
		expect(uniqueRefs).toHaveLength(1)
		failIndex[0]()
		await waitForAsyncState()
		expect(uniqueRefs).toHaveLength(2)
		resetState(indexAtoms, 0)
		await flush()
		expect(uniqueRefs).toHaveLength(3)
		resetState(indexAtoms, 0)
		await flush()
		expect(uniqueRefs).toHaveLength(3)
		assert(getByTestId(host, `loading`))
		assert(getByTestId(host, `4`))
		assert(getByTestId(host, `5`))
		assert(getByTestId(host, `6`))
		dispose()
		host.remove()
	})

	test(`referential identity`, async () => {
		const uniqueRefs: unknown[] = []
		const loaders: ((letter: string) => void)[] = []
		function loadLetter(...params: string[]) {
			for (const letter of params) {
				loaders.shift()?.(letter)
			}
		}
		const letterAtom = atom<Loadable<string>, Error>({
			key: `letter`,
			default: () =>
				new Promise<string>((resolve) => {
					loaders.push((letter: string) => {
						resolve(letter)
					})
				}),
			catch: [Error],
		})
		const { dispose, host } = await mountWithProvider(({ AS, Solid, host }) => {
			const Letter = () => {
				const letter = AS.useLoadable(letterAtom)
				const root = document.createElement(`div`)
				const child = createDisplay()
				const stableLetter = Solid.createMemo(() => letter())
				root.append(child)
				Solid.createEffect(() => {
					uniqueRefs.push(stableLetter())
				})
				Solid.createEffect(() => {
					const value = letter()
					if (value === `LOADING`) {
						setContainerState(root, `loading`)
						child.removeAttribute(`data-testid`)
						child.textContent = `Loading...`
						return
					}
					setContainerState(root, value.loading ? `loading` : `not-loading`)
					if (value.value instanceof Error) {
						setDisplay(child, `error`, value.value.message)
					} else {
						setDisplay(child, `${value.value}`)
					}
				})
				return root
			}
			host.append(Letter())
		})
		assert(getByTestId(host, `loading`))
		expect(uniqueRefs).toHaveLength(1)
		loadLetter(`A`)
		await waitForAsyncState()
		assert(getByTestId(host, `not-loading`))
		assert(getByTestId(host, `A`))
		expect(uniqueRefs).toHaveLength(2)
		resetState(letterAtom)
		resetState(letterAtom)
		await waitForAsyncState()
		assert(getByTestId(host, `loading`))
		assert(getByTestId(host, `A`))
		expect(uniqueRefs).toHaveLength(3)
		loadLetter(``, `C`)
		await waitForAsyncState()
		assert(getByTestId(host, `not-loading`))
		assert(getByTestId(host, `C`))
		expect(uniqueRefs).toHaveLength(4)
		setState(letterAtom, `D`)
		await waitForAsyncState()
		assert(getByTestId(host, `not-loading`))
		assert(getByTestId(host, `D`))
		expect(uniqueRefs).toHaveLength(4)
		dispose()
		host.remove()
	})
})

describe(`useJSON`, () => {
	it(`reads the json value of a mutable atom`, async () => {
		const numbersAtom = mutableAtom<UList<number>>({
			key: `numbers`,
			class: UList,
		})
		const { dispose, host } = await mountWithProvider(({ AS, Solid, host }) => {
			const Numbers = () => {
				const numbers = AS.useJSON(numbersAtom)
				const root = document.createElement(`div`)
				const display = createDisplay()
				root.append(display)
				Solid.createEffect(() => {
					setDisplay(display, JSON.stringify(numbers()))
				})
				return root
			}
			host.append(Numbers())
		})
		setState(numbersAtom, (current) => current.add(1).add(2))
		await flush()
		assert(getByTestId(host, `[1,2]`))
		dispose()
		host.remove()
	})

	it(`reads the json value of a mutable atom family member`, async () => {
		const numbersAtoms = mutableAtomFamily<UList<number>, string>({
			key: `numbers`,
			class: UList,
		})
		const { dispose, host } = await mountWithProvider(({ AS, Solid, host }) => {
			const Numbers = () => {
				const numbers = AS.useJSON(numbersAtoms, `family`)
				const root = document.createElement(`div`)
				const display = createDisplay()
				root.append(display)
				Solid.createEffect(() => {
					setDisplay(display, JSON.stringify(numbers()))
				})
				return root
			}
			host.append(Numbers())
		})
		setState(numbersAtoms, `family`, (current) => current.add(3).add(4))
		await flush()
		assert(getByTestId(host, `[3,4]`))
		dispose()
		host.remove()
	})
})

describe(`useAtomicRef`, () => {
	it(`makes an element available to use wherever`, async () => {
		const buttonAtom = atom<HTMLButtonElement | null>({
			key: `button`,
			default: null,
		})
		const { dispose, host } = await mountStandalone(({ AS, host }) => {
			function MyButton() {
				const ref = AS.useAtomicRef(buttonAtom, makeButtonRef)
				const button = document.createElement(`button`)
				button.type = `button`
				button.textContent = `Click me`
				button.addEventListener(`click`, () => {
					Utils.stdout(`hi`)
				})
				ref.current = button
				return button
			}
			host.append(MyButton())
		})
		await flush()
		getState(buttonAtom)?.click()
		expect(Utils.stdout).toHaveBeenCalledWith(`hi`)
		dispose()
		host.remove()
	})

	it(`makes an element available to use wherever (family overload)`, async () => {
		const buttonAtoms = atomFamily<HTMLButtonElement | null, string>({
			key: `button`,
			default: null,
		})
		const { dispose, host } = await mountStandalone(({ AS, host }) => {
			function MyButton() {
				const ref = AS.useAtomicRef(buttonAtoms, `myCoolButton`, makeButtonRef)
				const button = document.createElement(`button`)
				button.type = `button`
				button.textContent = `Click me`
				button.addEventListener(`click`, () => {
					Utils.stdout(`hi`)
				})
				ref.current = button
				return button
			}
			host.append(MyButton())
		})
		await flush()
		getState(buttonAtoms, `myCoolButton`)?.click()
		expect(Utils.stdout).toHaveBeenCalledWith(`hi`)
		dispose()
		host.remove()
	})
})
