import type { Logger, WritableToken } from "atom.io"
import {
	atom,
	atomFamily,
	disposeState,
	getState,
	redo,
	runTransaction,
	selector,
	setState,
	subscribe,
	timeline,
	transaction,
	undo,
} from "atom.io"
import { findState } from "atom.io/ephemeral"
import type { MoleculeToken, MoleculeTransactors } from "atom.io/immortal"
import {
	makeMolecule,
	makeRootMolecule,
	Molecule,
	moleculeFamily,
	seekState,
} from "atom.io/immortal"
import * as Internal from "atom.io/internal"
import { vitest } from "vitest"

import * as Utils from "../__util__"

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
	vitest.spyOn(Utils, `stdout0`)
})

describe(`timeline`, () => {
	it(`tracks the state of a group of scope`, () => {
		const a = atom<number>({
			key: `a`,
			default: 5,
		})
		const b = atom<number>({
			key: `b`,
			default: 0,
		})
		const c = atom<number>({
			key: `c`,
			default: 0,
		})

		const product_abc = selector<number>({
			key: `product of a, b, & c`,
			get: ({ get }) => {
				return get(a) * get(b) * get(c)
			},
		})

		const tl_abc = timeline({
			key: `a, b, & c`,
			scope: [a, b, c],
		})

		const tx_ab = transaction<() => void>({
			key: `increment a & b`,
			do: ({ set }) => {
				set(a, (n) => n + 1)
				set(b, (n) => n + 1)
			},
		})

		const tx_bc = transaction<(plus: number) => void>({
			key: `increment b & c`,
			do: ({ set }, add = 1) => {
				set(b, (n) => n + add)
				set(c, (n) => n + add)
			},
		})

		subscribe(tl_abc, Utils.stdout0)

		const expectation0 = () => {
			expect(getState(a)).toBe(5)
			expect(getState(b)).toBe(0)
			expect(getState(c)).toBe(0)
			expect(getState(product_abc)).toBe(0)
		}
		expectation0()

		setState(a, 1)
		const expectation1 = () => {
			expect(getState(a)).toBe(1)
			expect(getState(b)).toBe(0)
			expect(getState(c)).toBe(0)
			expect(getState(product_abc)).toBe(0)
		}
		expectation1()

		runTransaction(tx_ab)()
		const expectation2 = () => {
			expect(getState(a)).toBe(2)
			expect(getState(b)).toBe(1)
			expect(getState(c)).toBe(0)
			expect(getState(product_abc)).toBe(0)
		}
		expectation2()

		runTransaction(tx_bc)(2)
		const expectation3 = () => {
			expect(getState(a)).toBe(2)
			expect(getState(b)).toBe(3)
			expect(getState(c)).toBe(2)
		}
		expectation3()

		undo(tl_abc)
		expectation2()

		redo(tl_abc)
		expectation3()

		undo(tl_abc)
		undo(tl_abc)
		expectation1()

		undo(tl_abc)
		expectation0()

		const timelineData = Internal.IMPLICIT.STORE.timelines.get(tl_abc.key)

		if (!timelineData) throw new Error(`timeline data not found`)

		expect(timelineData.at).toBe(0)
		expect(timelineData.history.length).toBe(3)
		expect(Utils.stdout0).toHaveBeenCalledTimes(8)
	})
	test(`time traveling with nested transactions`, () => {
		const a = atom<number>({
			key: `a`,
			default: 0,
		})
		const incrementTX = transaction<(state: WritableToken<number>) => void>({
			key: `increment`,
			do: ({ set }, state) => {
				set(state, (n) => n + 1)
			},
		})

		const aTL = timeline({
			key: `a`,
			scope: [a],
		})
		const incrementTimesTX = transaction<
			(state: WritableToken<number>, times: number) => void
		>({
			key: `increment times`,
			do: ({ run }, state, times) => {
				for (let i = 0; i < times; ++i) {
					run(incrementTX)(state)
				}
			},
		})
		runTransaction(incrementTimesTX)(a, 3)
		expect(getState(a)).toBe(3)
		undo(aTL)
		expect(getState(a)).toBe(0)
		redo(aTL)
		expect(getState(a)).toBe(3)
	})
	test(`subscriptions when time-traveling`, () => {
		const a = atom<number>({
			key: `a`,
			default: 3,
		})
		const b = atom<number>({
			key: `b`,
			default: 6,
		})

		const product_ab = selector<number>({
			key: `product of a & b`,
			get: ({ get }) => {
				return get(a) * get(b)
			},
			set: ({ set }, value) => {
				set(a, Math.sqrt(value))
				set(b, Math.sqrt(value))
			},
		})

		const timeline_ab = timeline({
			key: `a & b`,
			scope: [a, b],
		})

		subscribe(a, Utils.stdout)

		setState(product_ab, 1)
		undo(timeline_ab)

		expect(getState(a)).toBe(3)

		expect(Utils.stdout).toHaveBeenCalledWith({ oldValue: 3, newValue: 1 })
		expect(Utils.stdout).toHaveBeenCalledWith({ oldValue: 1, newValue: 3 })
	})
	test(`history erasure from the past`, () => {
		const nameState = atom<string>({
			key: `name`,
			default: `josie`,
		})
		const nameCapitalizedState = selector<string>({
			key: `name_capitalized`,
			get: ({ get }) => {
				return get(nameState).toUpperCase()
			},
			set: ({ set }, value) => {
				set(nameState, value.toLowerCase())
			},
		})
		const setName = transaction<(s: string) => void>({
			key: `set name`,
			do: ({ set }, name) => {
				set(nameCapitalizedState, name)
			},
		})

		const nameHistory = timeline({
			key: `name history`,
			scope: [nameState],
		})

		expect(getState(nameState)).toBe(`josie`)

		setState(nameState, `vance`)
		setState(nameCapitalizedState, `JON`)
		runTransaction(setName)(`Sylvia`)

		const timelineData = Internal.IMPLICIT.STORE.timelines.get(nameHistory.key)

		if (!timelineData) throw new Error(`timeline data not found`)

		expect(getState(nameState)).toBe(`sylvia`)
		expect(timelineData.at).toBe(3)
		expect(timelineData.history.length).toBe(3)

		undo(nameHistory)
		expect(getState(nameState)).toBe(`jon`)
		expect(timelineData.at).toBe(2)
		expect(timelineData.history.length).toBe(3)

		undo(nameHistory)
		expect(getState(nameState)).toBe(`vance`)
		expect(timelineData.at).toBe(1)
		expect(timelineData.history.length).toBe(3)

		undo(nameHistory)
		expect(getState(nameState)).toBe(`josie`)
		expect(timelineData.at).toBe(0)
		expect(timelineData.history.length).toBe(3)

		runTransaction(setName)(`Mr. Jason Gold`)

		expect(getState(nameState)).toBe(`mr. jason gold`)
		expect(timelineData.at).toBe(1)
		expect(timelineData.history.length).toBe(1)
	})
	it(`adds members of a family already created`, () => {
		const findCountState = atomFamily<number, string>({
			key: `find count`,
			default: 0,
		})
		const myCountState = findState(findCountState, `foo`)
		const countsTL = timeline({
			key: `counts`,
			scope: [findCountState],
		})
		expect(getState(myCountState)).toBe(0)
		setState(myCountState, 1)
		expect(getState(myCountState)).toBe(1)
		undo(countsTL)
		expect(getState(myCountState)).toBe(0)
	})
	it(`may ignore atom updates conditionally`, () => {
		const count = atom<number>({
			key: `count`,
			default: 0,
		})

		const countTL = timeline({
			key: `count`,
			scope: [count],
			shouldCapture: (update) => {
				if (update.type === `atom_update`) {
					const atomKey = update.key
					const atomDefault = Internal.IMPLICIT.STORE.atoms.get(atomKey)?.default
					if (atomDefault === update.oldValue) {
						return false
					}
				}
				return true
			},
		})
		expect(getState(count)).toBe(0)
		setState(count, 1)
		expect(getState(count)).toBe(1)
		undo(countTL)
		expect(getState(count)).toBe(1)
		expect(Internal.IMPLICIT.STORE.timelines.get(countTL.key)?.at).toBe(0)
		setState(count, 2)
		expect(getState(count)).toBe(2)
		expect(Internal.IMPLICIT.STORE.timelines.get(countTL.key)?.at).toBe(1)
		undo(countTL)
		expect(getState(count)).toBe(1)
		expect(Internal.IMPLICIT.STORE.timelines.get(countTL.key)?.at).toBe(0)
	})
})

describe(`timeline state lifecycle`, () => {
	test(`states may be disposed via undo/redo`, () => {
		const countStates = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		const countsTL = timeline({
			key: `counts`,
			scope: [countStates],
		})
		const countState = findState(countStates, `my-key`)
		setState(countState, 1)
		expect(getState(countState)).toBe(1)
		disposeState(countState)
		undo(countsTL)
		undo(countsTL)
		undo(countsTL)
		expect(seekState(countStates, `my-key`)).toBe(undefined)
		redo(countsTL)
		expect(seekState(countStates, `my-key`)).toEqual({
			family: {
				key: `count`,
				subKey: `"my-key"`,
			},
			key: `count("my-key")`,
			type: `atom`,
		})
		redo(countsTL)
		redo(countsTL)
	})
	test(`molecules may be disposed via undo/redo`, () => {
		const hpAtoms = atomFamily<number, string>({
			key: `hp`,
			default: 0,
		})
		const unitMolecules = moleculeFamily({
			key: `unit`,
			new: class Unit {
				public hpState = this.transactors.bond(hpAtoms)
				public constructor(public transactors: MoleculeTransactors<string>) {}
			},
		})
		const gameTL = timeline({
			key: `game`,
			scope: [unitMolecules],
		})
		const game = makeRootMolecule(`world`)
		makeMolecule(game, unitMolecules, `captain`)
		expect(Internal.IMPLICIT.STORE.molecules.size).toBe(2)
		expect(Internal.IMPLICIT.STORE.atoms.size).toBe(1)
		undo(gameTL)
		expect(Internal.IMPLICIT.STORE.molecules.size).toBe(1)
		expect(Internal.IMPLICIT.STORE.atoms.size).toBe(0)
	})
})
