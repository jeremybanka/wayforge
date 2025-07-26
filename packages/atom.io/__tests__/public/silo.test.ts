import type {
	ReadonlyPureSelectorFamilyOptions,
	RegularAtomFamilyOptions,
	RegularAtomOptions,
} from "atom.io"
import { getState, Silo } from "atom.io"

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
			`Atom "count" not found in store "IMPLICIT_STORE".`,
		)
	})
	it(`creates stores with independent state families`, () => {
		const Uno = new Silo({ name: `uno`, lifespan: `ephemeral` })
		const Dos = new Silo({ name: `dos`, lifespan: `ephemeral` })

		const DEFAULT_COUNT_ATOMS_CONFIG: RegularAtomFamilyOptions<number, string> =
			{
				key: `counts`,
				default: 0,
			}
		const DEFAULT_DOUBLE_COUNT_SELECTORS_CONFIG: ReadonlyPureSelectorFamilyOptions<
			number,
			string
		> = {
			key: `doubleCounts`,
			get:
				(key) =>
				({ get }) =>
					get(countAtoms__Uno, key) * 2,
		}

		const countAtoms__Uno = Uno.atomFamily<number, string>(
			DEFAULT_COUNT_ATOMS_CONFIG,
		)
		const countAtoms__Dos = Dos.atomFamily<number, string>(
			DEFAULT_COUNT_ATOMS_CONFIG,
		)
		const doubleCountSelectors__Uno = Uno.selectorFamily<number, string>(
			DEFAULT_DOUBLE_COUNT_SELECTORS_CONFIG,
		)
		const doubleCountSelectors__Dos = Dos.selectorFamily<number, string>(
			DEFAULT_DOUBLE_COUNT_SELECTORS_CONFIG,
		)

		const countState__Uno = Uno.findState(countAtoms__Uno, `a`)
		const countState__Dos = Dos.findState(countAtoms__Dos, `b`)

		const UnoCountValue = Uno.getState(countState__Uno)
		const DosCountValue = Dos.getState(countState__Dos)
		const UnoDoubleCountValue = Uno.getState(doubleCountSelectors__Uno, `a`)
		const DosDoubleCountValue = Dos.getState(doubleCountSelectors__Dos, `b`)

		expect(UnoCountValue).toBe(0)
		expect(DosCountValue).toBe(0)
		expect(UnoDoubleCountValue).toBe(0)
		expect(DosDoubleCountValue).toBe(0)

		Uno.setState(countState__Uno, 1)
		Dos.setState(countState__Dos, 2)

		expect(Uno.getState(countState__Uno)).toBe(1)
		expect(Dos.getState(countState__Dos)).toBe(2)
		expect(Uno.getState(doubleCountSelectors__Uno, `a`)).toBe(2)
		expect(Dos.getState(doubleCountSelectors__Dos, `b`)).toBe(4)

		Uno.resetState(countState__Uno)
		Dos.resetState(countState__Dos)

		expect(Uno.getState(countState__Uno)).toBe(0)
		expect(Dos.getState(countState__Dos)).toBe(0)
		expect(Uno.getState(doubleCountSelectors__Uno, `a`)).toBe(0)
		expect(Dos.getState(doubleCountSelectors__Dos, `b`)).toBe(0)

		Uno.disposeState(countState__Uno)
		Dos.disposeState(countState__Dos)

		expect(hasImplicitStoreBeenCreated()).toBe(false)
		expect(() => getState(countState__Uno)).toThrowError(
			`Atom "counts(\\"a\\")" not found in store "IMPLICIT_STORE".`,
		)
	})
})
