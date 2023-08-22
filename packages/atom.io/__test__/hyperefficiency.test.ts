import { vitest } from "vitest"

import type { Transceiver, TransceiverMode } from "~/packages/anvl/reactivity"
import { Junction } from "~/packages/rel8/junction/src"

import * as UTIL from "./__util__"
import { IMPLICIT, Subject } from "../internal/src"
import type { Json } from "../src"
import {
	__INTERNAL__,
	atom,
	atomFamily,
	getState,
	redo,
	runTransaction,
	setLogLevel,
	setState,
	subscribe,
	timeline,
	transaction,
	undo,
} from "../src"
import { TransceiverSet, tracker, trackerFamily } from "../tracker/src"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 2
setLogLevel(LOG_LEVELS[CHOOSE])
const logger = __INTERNAL__.IMPLICIT.STORE.config.logger ?? console

beforeEach(() => {
	__INTERNAL__.clearStore()
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(UTIL, `stdout`)
})

describe(`hyperefficiency patterns`, () => {
	test(`mutable core with serializable update induction`, () => {
		type Update_Set = `set::${string}::${string}`
		type Update_Delete = `del::${string}::${string}` | `del::${string}`
		type Update = Update_Delete | Update_Set
		const core = atom<Map<string, Set<string>>>({
			key: `twoWayMap`,
			default: new Map(),
		})
		const inductor = atom<Update | null>({
			key: `latestUpdate`,
			default: null,
			effects: [
				({ onSet }) => {
					onSet(({ newValue }) => {
						const { unsubscribe } =
							IMPLICIT.STORE.subject.operationStatus.subscribe(() => {
								unsubscribe()
								setState(core, (map) => {
									if (newValue === null) {
										return map
									}
									const [type, a, b] = newValue.split(`::`)
									switch (type) {
										case `set`: {
											const aValues = map.get(a)
											const bValues = map.get(b)
											if (aValues) {
												aValues.add(b)
											} else {
												map.set(a, new Set([b]))
											}
											if (bValues) {
												bValues.add(a)
											} else {
												map.set(b, new Set([a]))
											}
										}
										break
										case `del`:
											if (b) {
												const aValues = map.get(a)
												if (aValues) {
													aValues.delete(b)
													if (aValues.size === 0) {
														map.delete(a)
													}
												}
												const bValues = map.get(b)
												if (bValues) {
													bValues.delete(a)
													if (bValues.size === 0) {
														map.delete(b)
													}
												}
											}
											break
									}
									return map
								})
							})
					})
				},
			],
		})

		subscribe(core, UTIL.stdout)
		expect(getState(core).get(`a`)).toBeUndefined()
		expect(getState(core).get(`1`)).toBeUndefined()
		setState(inductor, `set::a::1`)
		expect(getState(core).get(`a`)).toEqual(new Set([`1`]))
		expect(getState(core).get(`1`)).toEqual(new Set([`a`]))
		setState(inductor, `set::a::2`)
		expect(getState(core).get(`a`)).toEqual(new Set([`1`, `2`]))
		expect(getState(core).get(`1`)).toEqual(new Set([`a`]))
		expect(getState(core).get(`2`)).toEqual(new Set([`a`]))
		setState(inductor, `del::a::2`)
		expect(getState(core).get(`a`)).toEqual(new Set([`1`]))
		expect(getState(core).get(`1`)).toEqual(new Set([`a`]))
		expect(getState(core).get(`2`)).toBeUndefined()
		expect(UTIL.stdout).toHaveBeenCalledTimes(3)
	})

	type JunctionUpdate = `del:${string}:${string}` | `set:${string}:${string}`

	class JunctionTransceiver<ASide extends string, BSide extends string>
		extends Junction<ASide, BSide, null>
		implements Transceiver<JunctionUpdate>
	{
		protected mode: TransceiverMode = `record`
		protected readonly subject = new Subject<JunctionUpdate>()

		// public set(
		// 	a: string,
		// 	...rest: Content extends null ? [b: string] : [b: string, content: Content]
		// ): this
		// public set(
		// 	relation: { [Key in ASide | BSide]: string },
		// 	...rest: Content extends null ? [] | [b?: undefined] : [content: Content]
		// ): this
		public set(
			a: string | { [Key in ASide | BSide]: string },
			b?: string,
			// ...rest: Content extends null
			// 	? [] | [b?: string | undefined]
			// 	: [b: string, content: Content] | [content: Content]
		): this {
			super.set(a as any, b as any)
			// const b: string =
			// 	// @ts-expect-error we deduce hereby that this.b may index a
			// 	typeof rest[0] === `string` ? rest[0] : (a[this.b] as string)
			// const content: Content | undefined =
			// 	rest[1] ?? typeof rest[0] === `string` ? undefined : (rest[0] as Content)
			a = typeof a === `string` ? (a as string) : a[this.a]
			if (this.mode === `record`) {
				this.subject.next(`set:${a}:${b}`)
			}
			return this
		}

		public do(update: JunctionUpdate): this {
			this.mode = `playback`
			const [type, a, b] = update.split(`:`)
			switch (type) {
				case `set`:
					this.set(a, b)
					break
				case `del`:
					this.delete(a, b)
					break
			}
			this.mode = `record`
			return this
		}

		public undo(update: JunctionUpdate): this {
			this.mode = `playback`
			const [type, a, b] = update.split(`:`)
			switch (type) {
				case `set`:
					this.delete(a, b)
					break
				case `del`:
					this.set(a, b)
					break
			}
			this.mode = `record`
			return this
		}

		public observe(fn: (update: JunctionUpdate) => void): () => void {
			return this.subject.subscribe(fn).unsubscribe
		}
	}

	test(`junction transceiver`, () => {
		const myJunction = new JunctionTransceiver({
			between: [`a`, `b`],
			cardinality: `n:n`,
		})

		myJunction.observe(UTIL.stdout)

		expect(myJunction.getRelatedKeys(`a`)).toBeUndefined()
		expect(myJunction.getRelatedKeys(`1`)).toBeUndefined()
		myJunction.set(`a`, `1`)
		expect(myJunction.getRelatedKeys(`a`)).toEqual(new Set([`1`]))
		expect(myJunction.getRelatedKeys(`1`)).toEqual(new Set([`a`]))
		myJunction.set(`a`, `2`)
		expect(myJunction.getRelatedKeys(`a`)).toEqual(new Set([`1`, `2`]))
		expect(myJunction.getRelatedKeys(`1`)).toEqual(new Set([`a`]))
		expect(myJunction.getRelatedKeys(`2`)).toEqual(new Set([`a`]))
		myJunction.delete(`a`, `2`)
		expect(myJunction.getRelatedKeys(`a`)).toEqual(new Set([`1`]))
		expect(myJunction.getRelatedKeys(`1`)).toEqual(new Set([`a`]))
		expect(myJunction.getRelatedKeys(`2`)).toBeUndefined()
		expect(UTIL.stdout).toHaveBeenCalledTimes(3)

		myJunction.do(`set:a:1`)
		expect(myJunction.getRelatedKeys(`a`)).toEqual(new Set([`1`]))
		expect(myJunction.getRelatedKeys(`1`)).toEqual(new Set([`a`]))
		expect(myJunction.getRelatedKeys(`2`)).toBeUndefined()
		expect(UTIL.stdout).toHaveBeenCalledTimes(3)
		console.log(myJunction)
	})

	test(`junction transceiver + tracker`, () => {
		const junctionState = atom({
			key: `junction`,
			default: new JunctionTransceiver({
				between: [`a`, `b`],
				cardinality: `n:n`,
			}),
		})
		const junctionTracker = tracker(junctionState)

		const eventTL = timeline({
			key: `eventTL`,
			atoms: [junctionTracker],
		})

		subscribe(junctionState, UTIL.stdout)
		expect(getState(junctionState).getRelatedKeys(`a`)).toBeUndefined()
		expect(getState(junctionState).getRelatedKeys(`1`)).toBeUndefined()
		setState(junctionTracker, `set:a:1`)
		expect(getState(junctionState).getRelatedKeys(`a`)).toEqual(new Set([`1`]))
		expect(getState(junctionState).getRelatedKeys(`1`)).toEqual(new Set([`a`]))
		setState(junctionTracker, `set:a:2`)
		expect(getState(junctionState).getRelatedKeys(`a`)).toEqual(
			new Set([`1`, `2`]),
		)
		expect(getState(junctionState).getRelatedKeys(`1`)).toEqual(new Set([`a`]))
		expect(getState(junctionState).getRelatedKeys(`2`)).toEqual(new Set([`a`]))
		setState(junctionTracker, `del:a:1`)
		expect(getState(junctionState).getRelatedKeys(`a`)).toEqual(new Set([`2`]))
		expect(getState(junctionState).getRelatedKeys(`2`)).toEqual(new Set([`a`]))
		expect(getState(junctionState).getRelatedKeys(`1`)).toBeUndefined()
		expect(UTIL.stdout).toHaveBeenCalledTimes(3)

		undo(eventTL)
		expect(getState(junctionState).getRelatedKeys(`a`)).toEqual(
			new Set([`1`, `2`]),
		)

		undo(eventTL)
		expect(getState(junctionState).getRelatedKeys(`a`)).toEqual(new Set([`1`]))

		undo(eventTL)
		expect(getState(junctionState).getRelatedKeys(`a`)).toBeUndefined()

		redo(eventTL)
		expect(getState(junctionState).getRelatedKeys(`a`)).toEqual(new Set([`1`]))
	})

	test.only(`use the atomic store instead of a junction`, () => {
		const createRelationFamily = (key: string) => {
			const family = atomFamily<TransceiverSet<string>, string>({
				key,
				default: new TransceiverSet(),
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

		const junction = (
			key: string,
			defaults: {
				between: [string, string]
				cardinality: `1:1` | `1:n` | `n:n`
			},
		) => {
			const betweenState = betweenFamily(key)
			const cardinalityState = cardinalityFamily(key)
			const [findRelationsState, findRelationTrackerState] =
				createRelationFamily(`${key}:relations`)
			// const findContentsState = createContentsFamily(`${key}:contents`)

			const addRelationTX = transaction<(a: string, b: string) => void>({
				key: `addRelation`,
				do: ({ set }, a, b) => {
					const relationTrackerA = findRelationTrackerState(a)
					const relationTrackerB = findRelationTrackerState(b)
					set(relationTrackerA, `add:${b}`)
					set(relationTrackerB, `add:${a}`)
				},
			})
			const deleteRelationTX = transaction<(a: string, b: string) => void>({
				key: `deleteRelation`,
				do: ({ set }, a, b) => {
					const relationTrackerA = findRelationTrackerState(a)
					const relationTrackerB = findRelationTrackerState(b)
					set(relationTrackerA, `del:${b}`)
					set(relationTrackerB, `del:${a}`)
				},
			})
			const getRelatedKeysTX = transaction<(a: string) => Set<string>>({
				key: `getRelatedKeys`,
				do: ({ get }, a) => {
					const relations = get(findRelationsState(a))
					return relations
				},
			})

			setState(betweenState, defaults.between)
			setState(cardinalityState, defaults.cardinality)

			const j = new Junction(
				{
					between: getState(betweenState),
					cardinality: getState(cardinalityState),
				},
				{
					externalStore: {
						addRelation: runTransaction(addRelationTX),
						deleteRelation: runTransaction(deleteRelationTX),
						getRelatedKeys: runTransaction(getRelatedKeysTX),
					},
				},
			)

			return {
				j,
				// findContentsState,
				findRelationsState,
				findRelationTrackerState,
				addRelationTX,
				deleteRelationTX,
				getRelatedKeysTX,
			}
		}
		const myJunction = junction(`myJunction`, {
			between: [`a`, `b`],
			cardinality: `n:n`,
		})

		const eventTL = timeline({
			key: `eventTL`,
			atoms: [myJunction.findRelationTrackerState],
		})

		subscribe(myJunction.findRelationsState(`a`), UTIL.stdout)
		expect(getState(myJunction.findRelationsState(`a`))).toEqual(new Set())
		expect(getState(myJunction.findRelationsState(`b`))).toEqual(new Set())
	})
})
