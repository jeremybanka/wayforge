import type {
	AtomFamilyToken,
	Logger,
	RegularAtomToken,
	TimelineToken,
} from "atom.io"
import {
	atom,
	atomFamily,
	getState,
	redo,
	selector,
	selectorFamily,
	setState,
	timeline,
	undo,
} from "atom.io"
import { findState } from "atom.io/ephemeral"
import * as Internal from "atom.io/internal"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"
import { vitest } from "vitest"

import * as Utils from "../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 1
let logger: Logger

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = Internal.IMPLICIT.STORE.logger
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(Utils, `stdout`)
})

describe(`not found`, () => {
	test(`Internal.NotFoundError is thrown`, () => {
		let caught: Error | undefined
		try {
			setState({ key: `a`, type: `atom` }, 1)
		} catch (thrown) {
			if (thrown instanceof Error) {
				caught = thrown
			}
		}
		expect(caught).toBeInstanceOf(Internal.NotFoundError)
	})
})

describe(`graceful handling of improper usage`, () => {
	describe(`a nested call to setState is a violation`, () => {
		test(`the inner call results in a logger(warn) and enqueues the update`, () => {
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
				`atom`,
				`b`,
				`deferring setState at ${rejectionTime} until setState for "a" is done`,
			)

			expect(getState(a)).toBe(1)
			expect(getState(b)).toBe(true)
		})
	})
	describe(`giving an atom to multiple timelines is a violation`, () => {
		test(`the second timeline does not track the atom, and a logger(error) is given`, () => {
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
				`timeline`,
				`count_history_too`,
				`Failed to add atom "count" because it already belongs to timeline "count_history"`,
			)
			expect(countTimeline0Data?.history).toHaveLength(1)
			expect(countTimeline1Data?.history).toHaveLength(0)
		})
		test(`if a family is tracked by a timeline, a member of that family cannot be tracked by another timeline`, () => {
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
				`timeline`,
				`a_count_history`,
				`Failed to add atom "counts("a")" because its family "counts" already belongs to timeline "counts_history"`,
			)
			console.log(Internal.withdraw(aCount, Internal.IMPLICIT.STORE))
			console.log(countTimelineData?.history)
			expect(countTimelineData?.history).toHaveLength(2)
			expect(aCountTimelineData?.history).toHaveLength(0)
		})
	})
	describe(`creating two families with the same key is a violation`, () => {
		it(`throws an error when creating two families with the same key`, () => {
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
				`readonly_selector_family`,
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
				`Overwriting an existing Readonly Selector Family "count" in store "IMPLICIT_STORE". You can safely ignore this warning if it is due to hot module replacement.`,
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
				`selector_family`,
				`count`,
				`Overwriting an existing Mutable Atom Family "count" in store "IMPLICIT_STORE". You can safely ignore this warning if it is due to hot module replacement.`,
			)
		})
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
