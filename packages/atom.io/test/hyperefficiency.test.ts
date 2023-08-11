import { vitest } from "vitest"

import type { Json } from "~/packages/anvl/src/json"

import * as UTIL from "./__util__"
import {
	__INTERNAL__,
	atom,
	atomFamily,
	getState,
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

	type Update_Set = `set:${string}:${string}`
	type Update_Delete = `del:${string}:${string}`
	type Update = Update_Delete | Update_Set
	type TimelineEvent = `${Update}::${Update}`

	type Active<Struct extends Json> = {
		constructor: (data: Struct) => Active<Struct>
		toJSON: () => Struct
	}

	type TransmitterReceiver<U> = {
		do: (update: U) => void
		undo: (update: U) => void
		observe: (fn: (update: U) => void) => () => void
	}

	type JunctionCoreData = {}

	const IDLE = 0
	const RECORD = 1
	const PLAYBACK = 2
	class Junction implements TransmitterReceiver<Update>, Active<> {
		private mode = IDLE
		private readonly map = new Map<string, Set<string>>()
		private readonly subject = new Subject<TimelineEvent>()

		

		public set(a: string, b: string): this {
			if (this.mode === IDLE) {
				this.mode = RECORD
			}
			const setA = this.map.get(a)
			const setB = this.map.get(b)
			const next: Update = `set:${a}:${b}`
			const prev: Update = setA?.has(b) ? next : `del:${a}:${b}`
			if (setA) {
				setA.add(b)
			} else {
				this.map.set(a, new Set([b]))
			}
			if (setB) {
				setB.add(a)
			} else {
				this.map.set(b, new Set([a]))
			}
			if (this.mode === RECORD) {
				this.subject.next(`${prev}::${next}`)
			}
			return this
		}
		public delete(a: string, b: string): this {
			if (this.mode === IDLE) {
				this.mode = RECORD
			}
			const setA = this.map.get(a)
			const next: Update = `del:${a}:${b}`
			const prev: Update = setA?.has(b) ? next : `set:${a}:${b}`
			if (setA) {
				setA.delete(b)
				if (setA.size === 0) {
					this.map.delete(a)
				}
				const setB = this.map.get(b)
				if (setB) {
					setB.delete(a)
					if (setB.size === 0) {
						this.map.delete(b)
					}
				}
				if (this.mode === RECORD) {
					this.subject.next(`${prev}::${next}`)
				}
			}
			this.mode = IDLE
			return this
		}

		public get(a: string): Set<string> | undefined {
			return this.map.get(a)
		}

		public has(a: string, b?: string): boolean {
			if (b) {
				const setA = this.map.get(a)
				return setA?.has(b) ?? false
			}
			return this.map.has(a)
		}

		public do(event: TimelineEvent): this {
			console.log(`do`, event)
			this.mode = PLAYBACK
			const [_, next] = event.split(`::`)
			const [type, a, b] = next.split(`:`)
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

		public undo(event: TimelineEvent): this {
			this.mode = PLAYBACK
			const [prev, _] = event.split(`::`)
			const [type, a, b] = prev.split(`:`)
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

		public observe(fn: (event: TimelineEvent) => void): () => void {
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

		myJunction.do(`del:a:1::set:a:1`)
		expect(myJunction.get(`a`)).toEqual(new Set([`1`]))
		expect(myJunction.get(`1`)).toEqual(new Set([`a`]))
		expect(myJunction.get(`2`)).toBeUndefined()
		expect(UTIL.stdout).toHaveBeenCalledTimes(3)
		console.log(myJunction)
	})

	test.only(`junction => mutable core with serializable update induction`, () => {
		const junctionState = atom<Junction>({
			key: `junction`,
			default: new Junction(),
		})
		const latestEventState = atom<TimelineEvent | null>({
			key: `latestEvent`,
			default: null,
			effects: [
				({ onSet, setSelf }) => {
					onSet(({ newValue, oldValue }) => {
						console.log(`latestEvent`, { newValue, oldValue })
						const timelineId =
							IMPLICIT.STORE.timelineAtoms.getRelatedId(`latestEvent`)
						if (timelineId) {
							const timelineData = IMPLICIT.STORE.timelines.get(timelineId)
							if (timelineData?.timeTraveling) {
								const unsubscribe = subscribeToTimeline(
									{ key: timelineId, type: `timeline` },
									(update) => {
										console.log(`🔔 update`, update)
										console.log({ newValue, oldValue })
										console.log(timelineData)
										unsubscribe()
										setState(junctionState, (junction) => {
											if (timelineData.timeTraveling === `into_future`) {
												junction.do(newValue)
												console.log(`do`, junction)
												return junction
											} else {
												junction.undo(oldValue)
												console.log(`undo`, junction)
												return junction
											}
										})
									},
								)
								return
							}
						}

						const { unsubscribe } =
							IMPLICIT.STORE.subject.operationStatus.subscribe(() => {
								unsubscribe()
								if (newValue) {
									setState(junctionState, (junction) => junction.do(newValue))
								}
							})
					})
					getState(junctionState).observe((update) => {
						setSelf(update)
					})
				},
			],
		})

		const eventTL = timeline({
			key: `eventTL`,
			atoms: [latestEventState],
		})

		subscribe(junctionState, UTIL.stdout)
		expect(getState(junctionState).get(`a`)).toBeUndefined()
		expect(getState(junctionState).get(`1`)).toBeUndefined()
		setState(latestEventState, `del:a:1::set:a:1`)
		expect(getState(junctionState).get(`a`)).toEqual(new Set([`1`]))
		expect(getState(junctionState).get(`1`)).toEqual(new Set([`a`]))
		setState(latestEventState, `del:a:2::set:a:2`)
		expect(getState(junctionState).get(`a`)).toEqual(new Set([`1`, `2`]))
		expect(getState(junctionState).get(`1`)).toEqual(new Set([`a`]))
		expect(getState(junctionState).get(`2`)).toEqual(new Set([`a`]))
		setState(latestEventState, `set:a:1::del:a:1`)
		expect(getState(junctionState).get(`a`)).toEqual(new Set([`2`]))
		expect(getState(junctionState).get(`2`)).toEqual(new Set([`a`]))
		expect(getState(junctionState).get(`1`)).toBeUndefined()
		expect(UTIL.stdout).toHaveBeenCalledTimes(3)

		undo(eventTL)

		expect(getState(junctionState).get(`a`)).toEqual(new Set([`1`, `2`]))

		// undo(eventTL)

		// expect(getState(junctionState).get(`a`)).toEqual(new Set([`1`]))
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
			do: ({ get, set }, a, b) => {},
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
