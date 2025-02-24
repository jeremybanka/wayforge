import type { Logger } from "atom.io"
import {
	atom,
	getState,
	runTransaction,
	selector,
	subscribe,
	transaction,
} from "atom.io"
import * as Internal from "atom.io/internal"
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

describe(`transaction implementation specifics`, () => {
	it(`does not emit updates until the end of the transaction`, () => {
		const NOUNS = [`cat`, `child`, `antenna`] as const
		type Noun = (typeof NOUNS)[number]
		const PLURALS = {
			cat: `cats`,
			child: `children`,
			antenna: `antennae`,
		} as const
		type Plural = (typeof PLURALS)[Noun]
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
					(n) => PLURALS[n as Noun] === newValue,
				) as Noun
				set(nounState, noun)
			},
		})
		const expressionState = selector<`${number} ${Noun | Plural}`>({
			key: `expression`,
			get: ({ get }) => {
				const count = get(countState)
				const nounPhrase = count === 1 ? get(nounState) : get(pluralState)
				return `${get(countState)} ${nounPhrase}`
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
				const newNoun = newExpression.split(` `)[1] as Noun | Plural
				if (
					!NOUNS.includes(newNoun as Noun) &&
					!Object.values(PLURALS).includes(newNoun as Plural)
				) {
					throw new Error(
						`Invalid expression: ${newNoun} is not a recognized noun`,
					)
				}
				set(pluralState, newExpression.split(` `)[1] as Plural)
				return true
			},
		})

		expect(getState(expressionState)).toEqual(`2 cats`)
		vitest.spyOn(Utils, `stdout`)
		subscribe(expressionState, Utils.stdout)

		runTransaction(modifyExpression)(`3 children`)
		// 2 atoms were set, therefore 2 updates were made to the selector
		// this is a "playback" strategy, where the entire transaction is
		// captured, one atom at a time. An all-at-once strategy can be
		// more performant in some cases, so it may be added in the future.
		expect(Utils.stdout).toHaveBeenCalledTimes(2)
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
		expect(Utils.stdout).toHaveBeenCalledTimes(2)
		expect(getState(countState)).toEqual(3)
		expect(getState(pluralState)).toEqual(`children`)
		expect(getState(nounState)).toEqual(`child`)

		expect(logger.warn).toBeCalledTimes(1)
		expect(logger.error).not.toHaveBeenCalled()
	})
})
