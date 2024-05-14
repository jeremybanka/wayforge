import type { RegularAtomFamilyOptions, RegularAtomOptions } from "atom.io"
import { getState, Silo } from "atom.io"
import { IMPLICIT } from "atom.io/internal"

const hasImplicitStoreBeenCreated = () => IMPLICIT.STORE_INTERNAL !== undefined

afterEach(() => {
	IMPLICIT.STORE_INTERNAL = undefined
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

		Uno.setState(countState__Uno, 1)
		Dos.setState(countState__Dos, 2)

		expect(Uno.getState(countState__Uno)).toBe(1)
		expect(Dos.getState(countState__Dos)).toBe(2)

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

		const countAtoms__Uno = Uno.atomFamily<number, string>(
			DEFAULT_COUNT_ATOMS_CONFIG,
		)
		const countAtoms__Dos = Dos.atomFamily<number, string>(
			DEFAULT_COUNT_ATOMS_CONFIG,
		)

		const countState__Uno = Uno.findState(countAtoms__Uno, `a`)
		const countState__Dos = Dos.findState(countAtoms__Dos, `b`)

		const UnoCountValue = Uno.getState(countState__Uno)
		const DosCountValue = Dos.getState(countState__Dos)

		expect(UnoCountValue).toBe(0)
		expect(DosCountValue).toBe(0)

		Uno.setState(countState__Uno, 1)
		Dos.setState(countState__Dos, 2)

		expect(Uno.getState(countState__Uno)).toBe(1)
		expect(Dos.getState(countState__Dos)).toBe(2)

		expect(hasImplicitStoreBeenCreated()).toBe(false)
		expect(() => getState(countState__Uno)).toThrowError(
			`Atom_family "counts" not found in store "IMPLICIT_STORE".`,
		)
	})
})
