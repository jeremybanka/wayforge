import type {
	MutableAtomFamilyOptions,
	ReadonlyPureSelectorFamilyOptions,
	RegularAtomOptions,
} from "atom.io"
import { getState, Silo } from "atom.io"
import { UList } from "atom.io/transceivers/u-list"

const hasImplicitStoreBeenCreated = () =>
	globalThis.ATOM_IO_IMPLICIT_STORE !== undefined

afterEach(() => {
	globalThis.ATOM_IO_IMPLICIT_STORE = undefined
})

describe(`silo`, () => {
	it(`creates stores with independent states`, () => {
		const Uno = new Silo({
			name: `uno`,
			lifespan: `ephemeral`,
			isProduction: false,
		})
		const Dos = new Silo({
			name: `dos`,
			lifespan: `ephemeral`,
			isProduction: false,
		})

		const DEFAULT_COUNT_CONFIG: RegularAtomOptions<number> = {
			key: `count`,
			default: 0,
		}

		const UNO__countAtom = Uno.atom<number>(DEFAULT_COUNT_CONFIG)
		const DOS__countAtom = Dos.atom<number>(DEFAULT_COUNT_CONFIG)

		const UnoCountValue = Uno.getState(UNO__countAtom)
		const DosCountValue = Dos.getState(DOS__countAtom)

		expect(UnoCountValue).toBe(0)
		expect(DosCountValue).toBe(0)

		const subUno = vitest.fn()
		const subDos = vitest.fn()
		Uno.subscribe(UNO__countAtom, subUno)
		Dos.subscribe(DOS__countAtom, subDos)

		Uno.setState(UNO__countAtom, 1)
		Dos.setState(DOS__countAtom, 2)

		expect(Uno.getState(UNO__countAtom)).toBe(1)
		expect(Dos.getState(DOS__countAtom)).toBe(2)

		expect(subUno).toHaveBeenCalledWith({ newValue: 1, oldValue: 0 })
		expect(subDos).toHaveBeenCalledWith({ newValue: 2, oldValue: 0 })

		expect(hasImplicitStoreBeenCreated()).toBe(false)
		expect(() => getState(UNO__countAtom)).toThrowError(
			`atom "count" not found in store "IMPLICIT_STORE".`,
		)
	})
	it(`creates stores with independent state families`, () => {
		const Uno = new Silo({
			name: `uno`,
			lifespan: `ephemeral`,
			isProduction: false,
		})
		const Dos = new Silo({
			name: `dos`,
			lifespan: `ephemeral`,
			isProduction: false,
		})

		const DEFAULT_LIST_ATOMS_CONFIG: MutableAtomFamilyOptions<
			UList<number>,
			string
		> = {
			key: `counts`,
			class: UList,
		}
		const DEFAULT_SIZE_SELECTORS_CONFIG: ReadonlyPureSelectorFamilyOptions<
			number,
			string
		> = {
			key: `doubleCounts`,
			get:
				(key) =>
				({ get }) =>
					get(UNO__listAtoms, key).size,
		}

		const UNO__listAtoms = Uno.mutableAtomFamily<UList<number>, string>(
			DEFAULT_LIST_ATOMS_CONFIG,
		)
		const DOS__listAtoms = Dos.mutableAtomFamily<UList<number>, string>(
			DEFAULT_LIST_ATOMS_CONFIG,
		)
		const UNO__sizeSelectors = Uno.selectorFamily<number, string>(
			DEFAULT_SIZE_SELECTORS_CONFIG,
		)
		const DOS__sizeSelectors = Dos.selectorFamily<number, string>(
			DEFAULT_SIZE_SELECTORS_CONFIG,
		)

		const listState__Uno = Uno.findState(UNO__listAtoms, `a`)
		const listState__Dos = Dos.findState(DOS__listAtoms, `b`)

		const UnoCountValue = Uno.getState(listState__Uno)
		const DosCountValue = Dos.getState(listState__Dos)
		const UnoDoubleCountValue = Uno.getState(UNO__sizeSelectors, `a`)
		const DosDoubleCountValue = Dos.getState(DOS__sizeSelectors, `b`)

		expect(UnoCountValue).toEqual(new UList([]))
		expect(DosCountValue).toEqual(new UList([]))
		expect(UnoDoubleCountValue).toBe(0)
		expect(DosDoubleCountValue).toBe(0)

		Uno.setState(listState__Uno, (prev) => prev.add(1))
		Dos.setState(listState__Dos, (prev) => (prev.add(1), prev.add(2)))

		expect(Uno.getState(listState__Uno)).toEqual(new UList([1]))
		expect(Dos.getState(listState__Dos)).toEqual(new UList([1, 2]))
		expect(Uno.getState(UNO__sizeSelectors, `a`)).toBe(1)
		expect(Dos.getState(DOS__sizeSelectors, `b`)).toBe(2)

		Uno.resetState(listState__Uno)
		Dos.resetState(listState__Dos)

		expect(Uno.getState(listState__Uno)).toEqual(new UList([]))
		expect(Dos.getState(listState__Dos)).toEqual(new UList([]))
		expect(Uno.getState(UNO__sizeSelectors, `a`)).toBe(0)
		expect(Dos.getState(DOS__sizeSelectors, `b`)).toBe(0)

		Uno.disposeState(listState__Uno)
		Dos.disposeState(listState__Dos)

		expect(hasImplicitStoreBeenCreated()).toBe(false)
		expect(() => getState(listState__Uno)).toThrowError(
			`atom family [m] "counts" not found in store "IMPLICIT_STORE".`,
		)
	})
})
