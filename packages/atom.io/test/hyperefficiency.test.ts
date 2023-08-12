import { vitest } from "vitest"

import type { Json } from "~/packages/anvl/src/json"

import * as UTIL from "./__util__"
import type { AtomToken, Store } from "../src"
import {
	__INTERNAL__,
	atom,
	atomFamily,
	getState,
	redo,
	runTransaction,
	selectorFamily,
	setLogLevel,
	setState,
	subscribe,
	subscribeToTimeline,
	timeline,
	transaction,
	undo,
} from "../src"
import { IMPLICIT, Subject } from "../src/internal"

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

	type JunctionUpdate_Set = `set:${string}:${string}`
	type JunctionUpdate_Delete = `del:${string}:${string}`
	type JunctionUpdate = JunctionUpdate_Delete | JunctionUpdate_Set

	type TransmitterReceiver<Signal extends Json> = {
		do: (update: Signal) => void
		undo: (update: Signal) => void
		observe: (fn: (update: Signal) => void) => () => void
	}

	type JunctionData = {
		readonly relations: [string, string[]][]
	}

	const IDLE = 0
	const RECORD = 1
	const PLAYBACK = 2
	class Junction implements TransmitterReceiver<JunctionUpdate> {
		private mode = IDLE
		private readonly relations = new Map<string, Set<string>>()
		private readonly subject = new Subject<JunctionUpdate>()

		public constructor(data?: JunctionData) {
			if (data) {
				this.relations = new Map(data.relations.map(([a, b]) => [a, new Set(b)]))
			}
		}
		public toJSON(): JunctionData {
			return {
				relations: [...this.relations.entries()].map(([a, b]) => [a, [...b]]),
			}
		}

		public set(a: string, b: string): this {
			if (this.mode === IDLE) {
				this.mode = RECORD
			}
			const aRelations = this.relations.get(a)
			const bRelations = this.relations.get(b)
			if (aRelations?.has(b)) {
				return this
			}
			if (aRelations) {
				aRelations.add(b)
			} else {
				this.relations.set(a, new Set([b]))
			}
			if (bRelations) {
				bRelations.add(a)
			} else {
				this.relations.set(b, new Set([a]))
			}
			if (this.mode === RECORD) {
				this.subject.next(`set:${a}:${b}`)
			}
			return this
		}
		public delete(a: string, b: string): this {
			if (this.mode === IDLE) {
				this.mode = RECORD
			}
			const setA = this.relations.get(a)
			if (!setA?.has(b)) {
				return this
			}
			if (setA) {
				setA.delete(b)
				if (setA.size === 0) {
					this.relations.delete(a)
				}
				const setB = this.relations.get(b)
				if (setB) {
					setB.delete(a)
					if (setB.size === 0) {
						this.relations.delete(b)
					}
				}
				if (this.mode === RECORD) {
					this.subject.next(`del:${a}:${b}`)
				}
			}
			this.mode = IDLE
			return this
		}

		public get(a: string): Set<string> | undefined {
			return this.relations.get(a)
		}

		public has(a: string, b?: string): boolean {
			if (b) {
				const setA = this.relations.get(a)
				return setA?.has(b) ?? false
			}
			return this.relations.has(a)
		}

		public do(update: JunctionUpdate): this {
			this.mode = PLAYBACK
			const [type, a, b] = update.split(`:`)
			switch (type) {
				case `set`:
					this.set(a, b)
					break
				case `del`:
					this.delete(a, b)
					break
			}
			this.mode = IDLE
			return this
		}

		public undo(update: JunctionUpdate): this {
			this.mode = PLAYBACK
			const [type, a, b] = update.split(`:`)
			switch (type) {
				case `set`:
					this.delete(a, b)
					break
				case `del`:
					this.set(a, b)
					break
			}
			this.mode = IDLE
			return this
		}

		public observe(fn: (update: JunctionUpdate) => void): () => void {
			return this.subject.subscribe(fn).unsubscribe
		}
	}

	test(`junction`, () => {
		const myJunction = new Junction()

		myJunction.observe(UTIL.stdout)

		expect(myJunction.get(`a`)).toBeUndefined()
		expect(myJunction.get(`1`)).toBeUndefined()
		myJunction.set(`a`, `1`)
		expect(myJunction.get(`a`)).toEqual(new Set([`1`]))
		expect(myJunction.get(`1`)).toEqual(new Set([`a`]))
		myJunction.set(`a`, `2`)
		expect(myJunction.get(`a`)).toEqual(new Set([`1`, `2`]))
		expect(myJunction.get(`1`)).toEqual(new Set([`a`]))
		expect(myJunction.get(`2`)).toEqual(new Set([`a`]))
		myJunction.delete(`a`, `2`)
		expect(myJunction.get(`a`)).toEqual(new Set([`1`]))
		expect(myJunction.get(`1`)).toEqual(new Set([`a`]))
		expect(myJunction.get(`2`)).toBeUndefined()
		expect(UTIL.stdout).toHaveBeenCalledTimes(3)

		myJunction.do(`set:a:1`)
		expect(myJunction.get(`a`)).toEqual(new Set([`1`]))
		expect(myJunction.get(`1`)).toEqual(new Set([`a`]))
		expect(myJunction.get(`2`)).toBeUndefined()
		expect(UTIL.stdout).toHaveBeenCalledTimes(3)
		console.log(myJunction)
	})

	test.only(`junction => mutable core with serializable update induction`, () => {
		type CacheOptions<Core extends TransmitterReceiver<any>> = {
			key: string
			default: Core
		}

		const cache = <Core extends TransmitterReceiver<any>>(
			options: CacheOptions<Core>,
			store: Store = IMPLICIT.STORE,
		): [
			mutableCore: AtomToken<Core>,
			immutableProxy: AtomToken<
				(Core extends TransmitterReceiver<infer Signal> ? Signal : never) | null
			>,
		] => {
			const mutableCore = atom<Core>(options)
			const signalKey = `${options.key}:signal`
			const immutableProxy = atom<
				(Core extends TransmitterReceiver<infer Signal> ? Signal : never) | null
			>({
				key: signalKey,
				default: null,
				effects: [
					({ setSelf }) => {
						getState(mutableCore).observe((update) => setSelf(update))
					},
					({ onSet }) => {
						onSet(({ newValue, oldValue }) => {
							const timelineId = store.timelineAtoms.getRelatedId(signalKey)
							if (timelineId) {
								const timelineData = store.timelines.get(timelineId)
								if (timelineData?.timeTraveling) {
									const unsubscribe = subscribeToTimeline(
										{ key: timelineId, type: `timeline` },
										(update) => {
											unsubscribe()
											setState(mutableCore, (core) => {
												if (update === `redo` && newValue) {
													core.do(newValue)
												} else if (update === `undo` && oldValue) {
													core.undo(oldValue)
												}
												return core
											})
										},
									)
									return
								}
							}

							const { unsubscribe } = store.subject.operationStatus.subscribe(
								() => {
									unsubscribe()
									if (newValue) {
										setState(mutableCore, (core) => (core.do(newValue), core))
									}
								},
							)
						})
					},
				],
			})
			return [mutableCore, immutableProxy]
		}

		const [junctionState, junctionUpdater] = cache<Junction>({
			key: `junction`,
			default: new Junction(),
		})

		const eventTL = timeline({
			key: `eventTL`,
			atoms: [junctionUpdater],
		})

		subscribe(junctionState, UTIL.stdout)
		expect(getState(junctionState).get(`a`)).toBeUndefined()
		expect(getState(junctionState).get(`1`)).toBeUndefined()
		setState(junctionUpdater, `set:a:1`)
		expect(getState(junctionState).get(`a`)).toEqual(new Set([`1`]))
		expect(getState(junctionState).get(`1`)).toEqual(new Set([`a`]))
		setState(junctionUpdater, `set:a:2`)
		expect(getState(junctionState).get(`a`)).toEqual(new Set([`1`, `2`]))
		expect(getState(junctionState).get(`1`)).toEqual(new Set([`a`]))
		expect(getState(junctionState).get(`2`)).toEqual(new Set([`a`]))
		setState(junctionUpdater, `del:a:1`)
		expect(getState(junctionState).get(`a`)).toEqual(new Set([`2`]))
		expect(getState(junctionState).get(`2`)).toEqual(new Set([`a`]))
		expect(getState(junctionState).get(`1`)).toBeUndefined()
		expect(UTIL.stdout).toHaveBeenCalledTimes(3)

		undo(eventTL)
		expect(getState(junctionState).get(`a`)).toEqual(new Set([`1`, `2`]))

		undo(eventTL)
		expect(getState(junctionState).get(`a`)).toEqual(new Set([`1`]))

		undo(eventTL)
		expect(getState(junctionState).get(`a`)).toBeUndefined()

		redo(eventTL)
		expect(getState(junctionState).get(`a`)).toEqual(new Set([`1`]))
	})

	test(`(FAIL) use the atomic store instead of a junction`, () => {
		const ruleState = atom<`1:1` | `1:n` | `n:n`>({
			key: `rule`,
			default: `1:1`,
		})
		const findRelationState__INTERNAL = atomFamily<Set<string> | null, string>({
			key: `relations`,
			default: null,
		})
		const findRelationState = selectorFamily<Set<string> | null, string>({
			key: `findRelation`,
			get: (key) => ({ get }) => get(findRelationState__INTERNAL(key)),
			set: (key) => ({ get, set }, nextRelations) => {
				const previousRelations = get(findRelationState__INTERNAL(key))
				console.log(`START`)
				console.log({ previousRelations, nextRelations })
				if (previousRelations !== null) {
					for (const previousRelation of previousRelations) {
						if (!nextRelations?.has(previousRelation)) {
							console.log(`deleting`, previousRelation)
							const relationsOfFormerRelationState =
								findRelationState__INTERNAL(previousRelation)
							set(relationsOfFormerRelationState, (current) => {
								current?.delete(key)
								return current?.size === 0 ? null : current
							})
						}
					}
				}
				if (nextRelations !== null) {
					for (const nextRelation of nextRelations) {
						if (!previousRelations?.has(nextRelation)) {
							console.log(`adding`, nextRelation, `to`, key)
							const relationsOfNextRelationState =
								findRelationState__INTERNAL(nextRelation)
							set(relationsOfNextRelationState, (current) => {
								current?.add(key)
								return current ?? new Set([key])
							})
						}
					}
				}
				set(findRelationState__INTERNAL(key), nextRelations)
			},
		})
		const setRelationTX = transaction<(a: string, b: string) => void>({
			key: `setRelation`,
			do: ({ set }, a, b) => {
				set(findRelationState(a), (current) => current?.add(b) ?? new Set([b]))
			},
		})
		const deleteRelationTX = transaction<(a: string, b?: string) => void>({
			key: `deleteRelation`,
			do: () => {},
		})

		subscribe(findRelationState(`a`), UTIL.stdout)
		expect(getState(findRelationState(`a`))).toBeNull()
		expect(getState(findRelationState(`1`))).toBeNull()
		runTransaction(setRelationTX)(`a`, `1`)
		expect(getState(findRelationState(`a`))).toEqual(new Set([`1`]))
		expect(getState(findRelationState(`1`))).toEqual(new Set([`a`]))
		runTransaction(setRelationTX)(`a`, `2`)
		expect(getState(findRelationState(`a`))).toEqual(new Set([`1`, `2`]))
		expect(getState(findRelationState(`1`))).toEqual(new Set([`a`]))
		expect(getState(findRelationState(`2`))).toEqual(new Set([`a`]))
	})
})
