import { vitest } from "vitest"

import { Junction } from "~/packages/rel8/junction/src"

import { trackerFamily } from "atom.io/internal"
import { TransceiverSet } from "~/packages/anvl/reactivity"
import type { Json } from "../../json/src"
import type { Write } from "../../src"
import {
	__INTERNAL__,
	atomFamily,
	getState,
	runTransaction,
	setLogLevel,
	setState,
	timeline,
	transaction,
	undo,
} from "../../src"
import * as UTIL from "../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 3
setLogLevel(LOG_LEVELS[CHOOSE])
const logger = __INTERNAL__.IMPLICIT.STORE.config.logger ?? console

beforeEach(() => {
	__INTERNAL__.clearStore()
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(UTIL, `stdout`)
})

describe(`mutability patterns`, () => {
	test(`use the atomic store to back your junction`, () => {
		const createRelationFamily = (key: string) => {
			const family = atomFamily<TransceiverSet<string>, string>({
				key,
				default: () => new TransceiverSet(),
			})
			const findTracker = trackerFamily(family)
			return [family, findTracker] as const
		}
		const createContentsFamily = <Content extends Json.Object>(
			key: string,
			base: Content,
		) => {
			const family = atomFamily<Content, string>({
				key,
				default: base,
			})
			return family
		}
		const cardinalityFamily = atomFamily<`1:1` | `1:n` | `n:n`, string>({
			key: `cardinality`,
			default: `n:n`,
		})
		const betweenFamily = atomFamily<[string, string], string>({
			key: `between`,
			default: [`a`, `b`],
		})

		const junction = <ASide extends string, BSide extends string>(
			key: string,
			defaults: {
				between: [a: ASide, b: BSide]
				cardinality: `1:1` | `1:n` | `n:n`
			},
		) => {
			const betweenState = betweenFamily(key)
			const cardinalityState = cardinalityFamily(key)
			const [findRelationsState, findRelationTrackerState] =
				createRelationFamily(`${key}:relations`)

			// const findContentsState = createContentsFamily(`${key}:contents`)

			const addRelationWriteOperation: Write<(a: string, b: string) => void> = (
				{ set },
				a,
				b,
			) => {
				const relationTrackerA = findRelationTrackerState(a)
				const relationTrackerB = findRelationTrackerState(b)
				set(relationTrackerA, `add:${b}`)
				set(relationTrackerB, `add:${a}`)
			}
			const addRelationTX = transaction<(a: string, b: string) => void>({
				key: `addRelation`,
				do: addRelationWriteOperation,
			})

			const deleteRelationWriteOperation: Write<(a: string, b: string) => void> =
				({ set }, a, b) => {
					const relationTrackerA = findRelationTrackerState(a)
					const relationTrackerB = findRelationTrackerState(b)
					set(relationTrackerA, `del:${b}`)
					set(relationTrackerB, `del:${a}`)
				}
			const deleteRelationTX = transaction<(a: string, b: string) => void>({
				key: `deleteRelation`,
				do: deleteRelationWriteOperation,
			})

			setState(betweenState, defaults.between)
			setState(cardinalityState, defaults.cardinality)

			const j = new Junction<ASide, BSide, null>(
				{
					between: defaults.between,
					cardinality: getState(cardinalityState),
				},
				{
					externalStore: {
						has: (a, b) => {
							const aRelations = getState(findRelationsState(a))
							return b ? aRelations.has(b) : aRelations.size > 0
						},
						addRelation: runTransaction(addRelationTX),
						deleteRelation: runTransaction(deleteRelationTX),
						getRelatedKeys: (a) => getState(findRelationsState(a)),
					},
				},
			)

			return {
				j,
				findRelationsState,
				findRelationTrackerState,
				addRelationWriteOperation,
				deleteRelationWriteOperation,
			}
		}
		const {
			j: myJunction,
			findRelationsState,
			findRelationTrackerState,
			addRelationWriteOperation,
			deleteRelationWriteOperation,
		} = junction(`myJunction`, {
			between: [`room`, `player`],
			cardinality: `1:n`,
		})

		const relationsTimeline = timeline({
			key: `relations`,
			atoms: [findRelationTrackerState],
		})

		myJunction.set({ room: `a`, player: `b` })

		expect(getState(findRelationsState(`a`))).toEqual(new TransceiverSet([`b`]))
		expect(getState(findRelationsState(`b`))).toEqual(new TransceiverSet([`a`]))

		undo(relationsTimeline)

		expect(getState(findRelationsState(`a`))).toEqual(new TransceiverSet())

		myJunction.set({ room: `room1`, player: `a` })
		myJunction.set({ room: `room1`, player: `b` })
		myJunction.set({ room: `room1`, player: `c` })

		expect(getState(findRelationsState(`room1`))).toEqual(
			new TransceiverSet([`a`, `b`, `c`]),
		)

		const clearRelationsTX = transaction<(...keysToDelete: string[]) => number>({
			key: `clearRelations`,
			do: (transactors, ...keysToDelete) => {
				let tally = 0
				for (const key of keysToDelete) {
					const relatedKeys = getState(findRelationsState(key))
					for (const relatedKey of relatedKeys) {
						tally++
						deleteRelationWriteOperation(transactors, key, relatedKey)
					}
				}
				return tally
			},
		})
		runTransaction(clearRelationsTX)(`a`, `b`)

		expect(getState(findRelationsState(`a`))).toEqual(new TransceiverSet())
		expect(getState(findRelationsState(`b`))).toEqual(new TransceiverSet())
		expect(getState(findRelationsState(`c`))).toEqual(
			new TransceiverSet([`room1`]),
		)

		undo(relationsTimeline)

		expect(getState(findRelationsState(`room1`))).toEqual(
			new TransceiverSet([`a`, `b`, `c`]),
		)
	})
})
