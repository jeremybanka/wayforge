import { vitest } from "vitest"

import {
	atom,
	getState,
	runTransaction,
	selector,
	subscribe,
	transaction,
} from "atom.io"
import * as __INTERNAL__ from "atom.io/internal"
import * as UTIL from "./__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 1
__INTERNAL__.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
const { logger } = __INTERNAL__.IMPLICIT.STORE

beforeEach(() => {
	__INTERNAL__.clearStore()
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(UTIL, `stdout`)
})

describe(`transaction implementation specifics`, () => {
	it(`does not emit updates until the end of the transaction`, () => {
		const NOUNS = [`cat`, `child`, `antenna`] as const
		type Noun = typeof NOUNS[number]
		const PLURALS = {
			cat: `cats`,
			child: `children`,
			antenna: `antennae`,
		}
		type Plural = typeof PLURALS[Noun]
		const countState = atom<number>({
			key: `count`,
			default: 2,
		})
		const nounState = atom<Noun>({
			key: `noun`,
			default: `cat`,
		})
		const pluralState = selector<Plural>({
			key: `plural`,
			get: ({ get }) => {
				const noun = get(nounState)
				return PLURALS[noun]
			},
			set: ({ set }, newValue) => {
				const noun = Object.keys(PLURALS).find(
					(noun) => PLURALS[noun as Noun] === newValue,
				) as Noun
				set(nounState, noun)
			},
		})
		const expressionState = selector<Noun | Plural>({
			key: `expression`,
			get: ({ get }) => {
				const count = get(countState)
				const nounPhrase = count === 1 ? get(nounState) : get(pluralState)
				return get(countState) + ` ` + nounPhrase
			},
		})

		const modifyExpression = transaction({
			key: `modifyExpression`,
			do: ({ set }, newExpression: Noun | Plural) => {
				const newCount = Number(newExpression.split(` `)[0])
				if (Number.isNaN(newCount)) {
					throw new Error(`Invalid expression: ${newExpression} is not a number`)
				}
				set(countState, newCount)
				const newNoun = newExpression.split(` `)[1] as Noun
				if (
					!NOUNS.includes(newNoun) &&
					!Object.values(PLURALS).includes(newNoun)
				) {
					throw new Error(
						`Invalid expression: ${newNoun} is not a recognized noun`,
					)
				}
				set(pluralState, newExpression.split(` `)[1])
				return true
			},
		})

		expect(getState(expressionState)).toEqual(`2 cats`)
		vitest.spyOn(UTIL, `stdout`)
		subscribe(expressionState, UTIL.stdout)

		runTransaction(modifyExpression)(`3 children`)
		// 2 atoms were set, therefore 2 updates were made to the selector
		// this is a "playback" strategy, where the entire transaction is
		// captured, one atom at a time. An all-at-once strategy can be
		// more performant in some cases, so it may be added in the future.
		expect(UTIL.stdout).toHaveBeenCalledTimes(2)
		expect(getState(countState)).toEqual(3)
		expect(getState(pluralState)).toEqual(`children`)
		expect(getState(nounState)).toEqual(`child`)

		// but what if the transaction fails?
		let caught: unknown
		try {
			runTransaction(modifyExpression)(`3 ants`)
		} catch (thrown) {
			caught = thrown
		}
		expect(caught).toBeInstanceOf(Error)
		if (caught instanceof Error) {
			expect(caught.message).toEqual(
				`Invalid expression: ants is not a recognized noun`,
			)
		}
		// the transaction failed, so no updates were made
		expect(UTIL.stdout).toHaveBeenCalledTimes(2)
		expect(getState(countState)).toEqual(3)
		expect(getState(pluralState)).toEqual(`children`)
		expect(getState(nounState)).toEqual(`child`)
	})
	it(`does not emit updates until the end of the transaction`, () => {
		const countState = atom<number>({
			key: `count`,
			default: 2,
		})
		const doubleState = selector<number>({
			key: `double`,
			get: ({ get }) => get(countState) * 2,
			set: ({ set }, newValue) => set(countState, newValue / 2),
		})
		const doublePlusOneState = selector<number>({
			key: `doublePlusOne`,
			get: ({ get }) => get(doubleState) + 1,
			set: ({ set }, newValue) => set(doubleState, newValue - 1),
		})
		const tripleState = selector<number>({
			key: `triple`,
			get: ({ get }) => get(countState) * 3,
			set: ({ set }, newValue) => set(countState, newValue / 3),
		})
		const triplePlusOneState = selector<number>({
			key: `triplePlusOne`,
			get: ({ get }) => get(tripleState) + 1,
			set: ({ set }, newValue) => set(tripleState, newValue - 1),
		})
		const doublePlusOnePlusTriplePlusOneState = selector<number>({
			key: `doublePlusOnePlusTriplePlusOne`,
			get: ({ get }) => get(doublePlusOneState) + get(triplePlusOneState),
			set: ({ set }, newValue) => {
				const newValueMinusTwo = newValue - 2
				const count = newValueMinusTwo / 5
				set(doublePlusOneState, count * 2 + 1)
				set(triplePlusOneState, count * 3 + 1)
			},
		})

		vitest.spyOn(UTIL, `stdout`)
	})
})
