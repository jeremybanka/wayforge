import type { AtomOptions } from "../src"
import { getState } from "../src"
import { IMPLICIT } from "../src/internal"
import { silo } from "../src/silo"

const hasImplicitStoreBeenCreated = () => IMPLICIT.STORE_INTERNAL !== undefined

describe(`silo`, () => {
	it(`creates independent stores`, () => {
		const Uno = silo(`uno`)
		const Dos = silo(`dos`)

		const DEFAULT_COUNT_CONFIG: AtomOptions<number> = {
			key: `count`,
			default: 0,
		}

		const countState__Uno = Uno.atom(DEFAULT_COUNT_CONFIG)
		const countState__Dos = Dos.atom(DEFAULT_COUNT_CONFIG)

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
			`Atom "count" not found in store "DEFAULT".`,
		)
	})
})
