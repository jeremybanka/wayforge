import type {
	MutableAtomFamilyOptions,
	ReadonlyPureSelectorFamilyOptions,
	RegularAtomOptions,
} from "atom.io"
import { getState, Silo } from "atom.io"
import { SetRTX } from "atom.io/transceivers/set-rtx"

const hasImplicitStoreBeenCreated = () =>
	globalThis.ATOM_IO_IMPLICIT_STORE !== undefined

afterEach(() => {
	globalThis.ATOM_IO_IMPLICIT_STORE = undefined
})

describe(`silo`, () => {
	it(`creates stores with independent states`, () => {
		const Uno = new Silo({ name: `uno`, lifespan: `ephemeral` })
		const Dos = new Silo({ name: `dos`, lifespan: `ephemeral` })

		const DEFAULT_COUNT_CONFIG: RegularAtomOptions<number> = {
			key: `count`,
			default: 0,
		}

		const countState__Uno = Uno.atom<number>(DEFAULT_COUNT_CONFIG)
		const countState__Dos = Dos.atom<number>(DEFAULT_COUNT_CONFIG)

		const UnoCountValue = Uno.getState(countState__Uno)
		const DosCountValue = Dos.getState(countState__Dos)

		expect(UnoCountValue).toBe(0)
		expect(DosCountValue).toBe(0)

		const subUno = vitest.fn()
		const subDos = vitest.fn()
		Uno.subscribe(countState__Uno, subUno)
		Dos.subscribe(countState__Dos, subDos)

		Uno.setState(countState__Uno, 1)
		Dos.setState(countState__Dos, 2)

		expect(Uno.getState(countState__Uno)).toBe(1)
		expect(Dos.getState(countState__Dos)).toBe(2)

		expect(subUno).toHaveBeenCalledWith({ newValue: 1, oldValue: 0 })
		expect(subDos).toHaveBeenCalledWith({ newValue: 2, oldValue: 0 })

		expect(hasImplicitStoreBeenCreated()).toBe(false)
		expect(() => getState(countState__Uno)).toThrowError(
			`atom "count" not found in store "IMPLICIT_STORE".`,
		)
	})
	it(`creates stores with independent state families`, () => {
		const Uno = new Silo({ name: `uno`, lifespan: `ephemeral` })
		const Dos = new Silo({ name: `dos`, lifespan: `ephemeral` })

		const DEFAULT_LIST_ATOMS_CONFIG: MutableAtomFamilyOptions<
			SetRTX<number>,
			string
		> = {
			key: `counts`,
			class: SetRTX,
		}
		const DEFAULT_SIZE_SELECTORS_CONFIG: ReadonlyPureSelectorFamilyOptions<
			number,
			string
		> = {
			key: `doubleCounts`,
			get:
				(key) =>
				({ get }) =>
					get(listAtoms__Uno, key).size,
		}

		const listAtoms__Uno = Uno.mutableAtomFamily<SetRTX<number>, string>(
			DEFAULT_LIST_ATOMS_CONFIG,
		)
		const listAtoms__Dos = Dos.mutableAtomFamily<SetRTX<number>, string>(
			DEFAULT_LIST_ATOMS_CONFIG,
		)
		const sizeSelectors__Uno = Uno.selectorFamily<number, string>(
			DEFAULT_SIZE_SELECTORS_CONFIG,
		)
		const sizeSelectors__Dos = Dos.selectorFamily<number, string>(
			DEFAULT_SIZE_SELECTORS_CONFIG,
		)

		const listState__Uno = Uno.findState(listAtoms__Uno, `a`)
		const listState__Dos = Dos.findState(listAtoms__Dos, `b`)

		const UnoCountValue = Uno.getState(listState__Uno)
		const DosCountValue = Dos.getState(listState__Dos)
		const UnoDoubleCountValue = Uno.getState(sizeSelectors__Uno, `a`)
		const DosDoubleCountValue = Dos.getState(sizeSelectors__Dos, `b`)

		expect(UnoCountValue).toEqual(new SetRTX([]))
		expect(DosCountValue).toEqual(new SetRTX([]))
		expect(UnoDoubleCountValue).toBe(0)
		expect(DosDoubleCountValue).toBe(0)

		Uno.setState(listState__Uno, (prev) => prev.add(1))
		Dos.setState(listState__Dos, (prev) => (prev.add(1), prev.add(2)))

		expect(Uno.getState(listState__Uno)).toEqual(new SetRTX([1]))
		expect(Dos.getState(listState__Dos)).toEqual(new SetRTX([1, 2]))
		expect(Uno.getState(sizeSelectors__Uno, `a`)).toBe(1)
		expect(Dos.getState(sizeSelectors__Dos, `b`)).toBe(2)

		Uno.resetState(listState__Uno)
		Dos.resetState(listState__Dos)

		expect(Uno.getState(listState__Uno)).toEqual(new SetRTX([]))
		expect(Dos.getState(listState__Dos)).toEqual(new SetRTX([]))
		expect(Uno.getState(sizeSelectors__Uno, `a`)).toBe(0)
		expect(Dos.getState(sizeSelectors__Dos, `b`)).toBe(0)

		Uno.disposeState(listState__Uno)
		Dos.disposeState(listState__Dos)

		expect(hasImplicitStoreBeenCreated()).toBe(false)
		expect(() => getState(listState__Uno)).toThrowError(
			`atom family [m] "counts" not found in store "IMPLICIT_STORE".`,
		)
	})
})
