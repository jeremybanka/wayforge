import { atom, mutableAtom } from "atom.io"
import type { Fn } from "atom.io/internal"
import { clearStore, IMPLICIT } from "atom.io/internal"
import { UList } from "atom.io/transceivers/u-list"

vi.mock(`solid-js`, async () => import(`solid-js/dist/solid.js`))

const flush = async (): Promise<void> => {
	await Promise.resolve()
}

const getByTestId = (host: HTMLElement, testId: string): HTMLElement => {
	const found = host.querySelector<HTMLElement>(`[data-testid="${testId}"]`)
	if (!found) {
		throw new Error(`Could not find [data-testid="${testId}"]`)
	}
	return found
}

const loadSolidIntegration = async () => {
	const Solid = await import(`solid-js`)
	const AS = await import(`atom.io/solid`)
	return { AS, Solid }
}

describe(`regular atom`, () => {
	const setters: Fn[] = []

	beforeEach(() => {
		clearStore(IMPLICIT.STORE)
		setters.length = 0
	})

	const scenario = async () => {
		const { AS, Solid } = await loadSolidIntegration()
		const letterAtom = atom<string>({
			key: `letter`,
			default: `A`,
		})
		const observed: string[] = []
		const host = document.createElement(`div`)
		document.body.append(host)

		const Letter = () => {
			const setLetter = AS.useI(letterAtom)
			const letter = AS.useO(letterAtom)

			const root = document.createElement(`div`)
			const display = document.createElement(`div`)
			const button = document.createElement(`button`)
			button.type = `button`
			button.dataset[`testid`] = `changeStateButton`
			button.addEventListener(`click`, () => {
				setLetter(`B`)
			})
			root.append(display, button)

			Solid.createEffect(() => {
				const value = letter()
				setters.push(setLetter)
				display.dataset[`testid`] = value
				display.textContent = value
			})

			return root
		}

		const Observer = () => {
			const value = AS.useO(letterAtom)
			Solid.createEffect(() => {
				observed.push(value())
			})
			return null
		}

		let dispose: () => void = () => {}
		Solid.createRoot((rootDispose) => {
			dispose = rootDispose
			AS.StoreProvider({
				children: (() => {
					Observer()
					host.append(Letter())
					return undefined
				}) as unknown as never,
			})
		})

		await flush()
		return { dispose, host, observed }
	}

	it(`accepts user input with externally managed state`, async () => {
		const { dispose, host, observed } = await scenario()
		const changeStateButton = getByTestId(host, `changeStateButton`)
		changeStateButton.click()
		await flush()
		const option = getByTestId(host, `B`)
		assert(option)
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
		clearStore(IMPLICIT.STORE)
		setters.length = 0
	})

	const scenario = async () => {
		const { AS, Solid } = await loadSolidIntegration()
		const lettersAtom = mutableAtom<UList<string>>({
			key: `letters`,
			class: UList,
		})
		const observed: string[] = []
		const host = document.createElement(`div`)
		document.body.append(host)

		const Letter = () => {
			const setLetter = AS.useI(lettersAtom)
			const letters = AS.useO(lettersAtom)

			const root = document.createElement(`div`)
			const display = document.createElement(`div`)
			const button = document.createElement(`button`)
			button.type = `button`
			button.dataset[`testid`] = `changeStateButton`
			button.addEventListener(`click`, () => {
				setLetter((self) => self.add(`A`))
			})
			root.append(display, button)

			Solid.createEffect(() => {
				const value = letters()
				setters.push(setLetter)
				display.dataset[`testid`] = value.has(`A`) ? `yes` : `no`
			})

			return root
		}

		const Observer = () => {
			const value = AS.useO(lettersAtom)
			Solid.createEffect(() => {
				observed.push(value().has(`A`) ? `yes` : `no`)
			})
			return null
		}

		let dispose: () => void = () => {}
		Solid.createRoot((rootDispose) => {
			dispose = rootDispose
			AS.StoreProvider({
				children: (() => {
					Observer()
					host.append(Letter())
					return undefined
				}) as unknown as never,
			})
		})

		await flush()
		return { dispose, host, observed }
	}

	it(`accepts user input with externally managed state`, async () => {
		const { dispose, host, observed } = await scenario()
		expect(observed).toEqual([`no`])
		const changeStateButton = getByTestId(host, `changeStateButton`)
		changeStateButton.click()
		await flush()
		const option = getByTestId(host, `yes`)
		assert(option)
		expect(observed).toEqual([`no`, `yes`])
		expect(setters.length).toBe(2)
		expect(setters[0]).toBe(setters[1])
		dispose()
		host.remove()
	})
})
