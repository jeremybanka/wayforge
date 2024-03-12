import type { RegularAtomOptions } from "atom.io"
import { Silo, getState } from "atom.io"
import { IMPLICIT } from "atom.io/internal"

const hasImplicitStoreBeenCreated = () => IMPLICIT.STORE_INTERNAL !== undefined

describe(`silo`, () => {
	it(`creates independent stores`, () => {
		const Uno = new Silo(`uno`)
		const Dos = new Silo(`dos`)

		const DEFAULT_COUNT_CONFIG: RegularAtomOptions<number> = {
			key: `count`,
			default: 0,
		}

		const countStateUno = Uno.atom(DEFAULT_COUNT_CONFIG)
		const countStateDos = Dos.atom(DEFAULT_COUNT_CONFIG)

		const UnoCountValue = Uno.getState(countStateUno)
		const DosCountValue = Dos.getState(countStateDos)

		expect(UnoCountValue).toBe(0)
		expect(DosCountValue).toBe(0)

		Uno.setState(countStateUno, 1)
		Dos.setState(countStateDos, 2)

		expect(Uno.getState(countStateUno)).toBe(1)
		expect(Dos.getState(countStateDos)).toBe(2)

		expect(hasImplicitStoreBeenCreated()).toBe(false)
		expect(() => getState(countStateUno)).toThrowError(
			`Atom "count" not found in store "IMPLICIT_STORE".`,
		)
	})
})
