import type {
	AtomFamilyToken,
	Logger,
	RegularAtomToken,
	TimelineToken,
} from "atom.io"
import {
	atom,
	atomFamily,
	findState,
	getState,
	redo,
	selector,
	selectorFamily,
	setState,
	timeline,
	undo,
} from "atom.io"
import * as Internal from "atom.io/internal"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"
import { vitest } from "vitest"

import * as Utils from "../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 2
let logger: Logger

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = Internal.IMPLICIT.STORE.logger = Utils.createNullLogger()
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(Utils, `stdout`)
})

describe(`Internal.NotFoundError is thrown`, () => {
	test(`when attempting to get a totally nonexistent state`, () => {
		let caught: Error | undefined
		try {
			getState({ key: `a`, type: `atom` })
		} catch (thrown) {
			if (thrown instanceof Error) {
				caught = thrown
			}
		}
		expect(caught).toBeInstanceOf(Internal.NotFoundError)
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
	test(`when attempting to set a totally nonexistent state`, () => {
		let caught: Error | undefined
		try {
			setState({ key: `a`, type: `atom` }, 1)
		} catch (thrown) {
			if (thrown instanceof Error) {
				caught = thrown
			}
		}
		expect(caught).toBeInstanceOf(Internal.NotFoundError)
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
	test(`when attempting to find a state in a nonexistent family`, () => {
		let caught: Error | undefined
		try {
			findState({ key: `a`, type: `atom_family` }, `b`)
		} catch (thrown) {
			if (thrown instanceof Error) {
				caught = thrown
			}
		}
		expect(caught).toBeInstanceOf(Internal.NotFoundError)
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
})

describe(`nested setState withing a setState callback`, () => {
	test(`the inner call is deferred, and a logger(info) is given`, () => {
		const a = atom<number>({
			key: `a`,
			default: 0,
		})
		const b = atom<boolean>({
			key: `b`,
			default: false,
		})
		const c = atom<string>({
			key: `c`,
			default: `hi`,
		})
		const s = selector<number>({
			key: `s`,
			get: ({ get }) => {
				return get(b) ? get(a) + 1 : 0
			},
			set: ({ set }, n) => {
				set(a, n)
				set(b, true)
				set(c, `bye`)
			},
		})
		let rejectionTime = ``
		setState(a, (n) => {
			setState(b, true)
			rejectionTime =
				[
					...Internal.IMPLICIT.STORE.on.operationClose.subscribers.keys(),
				][0].match(/(T-\d+\.\d+)/)?.[1] ?? `` // 😎👍
			return n + 1
		})

		expect(logger.info).toHaveBeenCalledWith(
			`❗`,
			b.type,
			b.key,
			`deferring setState at ${rejectionTime} until setState for "${a.key}" is done`,
		)

		expect(getState(a)).toBe(1)
		expect(getState(b)).toBe(true)

		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
})
describe(`two timelines attempt to own the same atom`, () => {
	test(`second timeline does not get ownership, and a logger(error) is given`, () => {
		const countState = atom<number>({
			key: `count`,
			default: 0,
		})
		const countTimeline000 = timeline({
			key: `count_history`,
			scope: [countState],
		})
		const countTimeline001 = timeline({
			key: `count_history_too`,
			scope: [countState],
		})
		setState(countState, 1)
		const countTimeline0Data =
			Internal.IMPLICIT.STORE.timelines.get(`count_history`)
		const countTimeline1Data =
			Internal.IMPLICIT.STORE.timelines.get(`count_history_too`)

		expect(logger.error).toHaveBeenCalledWith(
			`❌`,
			countTimeline001.type,
			countTimeline001.key,
			`Failed to add atom "count" because it already belongs to timeline "count_history"`,
		)
		expect(countTimeline0Data?.history).toHaveLength(1)
		expect(countTimeline1Data?.history).toHaveLength(0)

		expect(logger.warn).not.toHaveBeenCalled()
	})
	test(`if a family is owned by a timeline, so all are its members`, () => {
		const countStates = atomFamily<number, string>({
			key: `counts`,
			default: 0,
		})
		const countTimeline = timeline({
			key: `counts_history`,
			scope: [countStates],
		})
		const aCount = findState(countStates, `a`)
		const aCountTimeline = timeline({
			key: `a_count_history`,
			scope: [aCount],
		})
		setState(aCount, 1)

		const countTimelineData = Internal.IMPLICIT.STORE.timelines.get(
			countTimeline.key,
		)
		const aCountTimelineData = Internal.IMPLICIT.STORE.timelines.get(
			aCountTimeline.key,
		)
		expect(logger.error).toHaveBeenCalledWith(
			`❌`,
			aCountTimeline.type,
			aCountTimeline.key,
			`Failed to add atom "counts("a")" because its family "counts" already belongs to timeline "counts_history"`,
		)
		expect(countTimelineData?.history).toHaveLength(2)
		expect(aCountTimelineData?.history).toHaveLength(0)

		expect(logger.warn).not.toHaveBeenCalled()
	})
})
describe(`two families may not have the same key`, () => {
	it(`throws an error`, () => {
		const countAtoms = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		expect(logger.error).toHaveBeenLastCalledWith(
			`❗`,
			`atom_family`,
			`count`,
			`Overwriting an existing Atom Family "count" in store "IMPLICIT_STORE". You can safely ignore this warning if it is due to hot module replacement.`,
		)

		selectorFamily<number, string>({
			key: `count`,
			get:
				(key) =>
				({ get }) =>
					get(findState(countAtoms, key)),
		})
		expect(logger.error).toHaveBeenLastCalledWith(
			`❗`,
			`readonly_pure_selector_family`,
			`count`,
			`Overwriting an existing Atom Family "count" in store "IMPLICIT_STORE". You can safely ignore this warning if it is due to hot module replacement.`,
		)

		atomFamily<SetRTX<number>, SetRTXJson<number>, string>({
			key: `count`,
			mutable: true,
			default: () => new SetRTX<number>(),
			toJson: (set) => set.toJSON(),
			fromJson: (json) => SetRTX.fromJSON(json),
		})

		expect(logger.error).toHaveBeenLastCalledWith(
			`❗`,
			`mutable_atom_family`,
			`count`,
			`Overwriting an existing Readonly Pure Selector Family "count" in store "IMPLICIT_STORE". You can safely ignore this warning if it is due to hot module replacement.`,
		)
		selectorFamily<number, string>({
			key: `count`,
			get:
				(key) =>
				({ get }) =>
					get(findState(countAtoms, key)),
			set:
				(key) =>
				({ set }, newValue) => {
					set(findState(countAtoms, key), newValue)
				},
		})

		expect(logger.error).toHaveBeenLastCalledWith(
			`❗`,
			`writable_pure_selector_family`,
			`count`,
			`Overwriting an existing Mutable Atom Family "count" in store "IMPLICIT_STORE". You can safely ignore this warning if it is due to hot module replacement.`,
		)

		selectorFamily<{ count: number }, string>({
			key: `count`,
			const: () => ({ count: 0 }),
			get:
				(key) =>
				({ get }, self) => {
					self.count = get(findState(countAtoms, key))
				},
			set:
				(key) =>
				({ set }, newValue) => {
					set(findState(countAtoms, key), newValue.count)
				},
		})

		expect(logger.error).toHaveBeenLastCalledWith(
			`❗`,
			`writable_held_selector_family`,
			`count`,
			`Overwriting an existing Writable Pure Selector Family "count" in store "IMPLICIT_STORE". You can safely ignore this warning if it is due to hot module replacement.`,
		)

		selectorFamily<{ count: number }, string>({
			key: `count`,
			const: () => ({ count: 0 }),
			get:
				(key) =>
				({ get }, self) => {
					self.count = get(findState(countAtoms, key))
				},
		})

		expect(logger.error).toHaveBeenLastCalledWith(
			`❗`,
			`readonly_held_selector_family`,
			`count`,
			`Overwriting an existing Writable Held Selector Family "count" in store "IMPLICIT_STORE". You can safely ignore this warning if it is due to hot module replacement.`,
		)

		atomFamily<number, string>({
			key: `count`,
			default: 0,
		})

		expect(logger.error).toHaveBeenLastCalledWith(
			`❗`,
			`atom_family`,
			`count`,
			`Overwriting an existing Readonly Held Selector Family "count" in store "IMPLICIT_STORE". You can safely ignore this warning if it is due to hot module replacement.`,
		)
	})
})

describe(`recipes`, () => {
	describe(`timeline family recipe`, () => {
		it(`creates a timeline for each atom in the family`, () => {
			const f = atomFamily<number, string>({
				key: `f`,
				default: 0,
			})
			const ftl = (
				key: string,
			): [state: RegularAtomToken<number>, timeline: TimelineToken<any>] => {
				const WritableToken = findState(f, key)
				const timelineToken = timeline({
					key: `timeline for ${WritableToken.key}`,
					scope: [WritableToken],
				})
				return [WritableToken, timelineToken]
			}
			const [a, atl] = ftl(`a`)

			setState(a, 1)
			undo(atl)
			undo(atl)
			redo(atl)
			redo(atl)
		})
	})
})

describe(`findState`, () => {
	it(`throws an error if the family is not found`, () => {
		const token: AtomFamilyToken<any, any> = {
			key: `does not exist`,
			type: `atom_family`,
		}
		expect(() =>
			findState(token, `whatever`),
		).toThrowErrorMatchingInlineSnapshot(
			`[Error: Atom Family "does not exist" not found in store "IMPLICIT_STORE".]`,
		)
	})
})

describe(`internal debugging`, () => {
	describe(`warnings for misuse of the operation module`, () => {
		test(`markDone`, () => {
			Internal.markDone(Internal.IMPLICIT.STORE, `a`)
			expect(logger.error).toHaveBeenLastCalledWith(
				`🐞`,
				`unknown`,
				`a`,
				`markDone called outside of an operation. This is probably a bug in AtomIO.`,
			)
		})
		test(`isDone`, () => {
			Internal.isDone(Internal.IMPLICIT.STORE, `a`)
			expect(logger.error).toHaveBeenLastCalledWith(
				`🐞`,
				`unknown`,
				`a`,
				`isDone called outside of an operation. This is probably a bug in AtomIO.`,
			)
		})
	})
})
