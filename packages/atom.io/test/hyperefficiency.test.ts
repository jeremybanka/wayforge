import { vitest } from "vitest"

import { cache } from "~/packages/atom.io/src/mutable-cache"
import { Junct } from "~/packages/junct/src"

import * as UTIL from "./__util__"
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
	timeline,
	transaction,
	undo,
} from "../src"
import { IMPLICIT } from "../src/internal"

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

	test(`junction`, () => {
		const myJunction = new Junct()

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
		const [junctionState, junctionUpdater] = cache<Junct>({
			key: `junction`,
			default: new Junct(),
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
