import { vitest } from "vitest"

import type { Transceiver, TransceiverMode } from "~/packages/anvl/reactivity"
import type { JunctionConfig } from "~/packages/rel8/junction/src"
import { Junction } from "~/packages/rel8/junction/src"

import * as UTIL from "./__util__"
import { IMPLICIT, Subject } from "../internal/src"
import type { AtomFamily, AtomToken, Json } from "../src"
import {
	__INTERNAL__,
	atom,
	atomFamily,
	getState,
	redo,
	setLogLevel,
	setState,
	subscribe,
	timeline,
	undo,
} from "../src"
import { tracker } from "../tracker/src"

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
		public delete(a?: string, b?: string): this
		public delete(
			relation:
				| Record<ASide | BSide, string>
				| Record<ASide, string>
				| Record<BSide, string>,
			b?: undefined,
		): this
		public delete(
			a?:
				| Record<ASide | BSide, string>
				| Record<ASide, string>
				| Record<BSide, string>
				| string,
			b?: string,
		): this {
			// @ts-expect-error we deduce that this.b may index a
			b = typeof b === `string` ? b : (a[this.b] as string | undefined)
			// @ts-expect-error we deduce that this.a may index a
			const a0 = typeof a === `string` ? a : (a[this.a] as string | undefined)
			if (a0 && b) {
				const setA = this.relations.get(a0)
				if (!setA?.has(b)) {
					return this
				}
			}
			super.delete(a0, b)
			if (this.mode === `record`) {
				this.subject.next(`del:${a}:${b}`)
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

	test(`use the atomic store instead of a junction`, () => {
		const createRelationFamily = (key: string) => {
			const family = atomFamily<Set<string>, string>({
				key,
				default: new Set(),
			})
			return family
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
		const cardinalityFamily = atomFamily<`1:1` | `1:n` | `n:1` | `n:n`, string>({
			key: `cardinality`,
			default: `n:n`,
		})
		const betweenFamily = atomFamily<[string, string], string>({
			key: `between`,
			default: [`a`, `b`],
		})

		function join<
			ASide extends string,
			BSide extends string,
			Content extends Json.Object | null,
		>({
			key,
			between,
			cardinality,
			default: defaultContent,
		}: JunctionConfig<ASide, BSide, Content> & {
			default: Content
			key: string
		}): {
			betweenState: AtomToken<[string, string]>
			cardinalityState: AtomToken<`1:1` | `1:n` | `n:1` | `n:n`>
			findRelationsState: AtomFamily<Set<string>, string>
			findContentsState: Content extends null ? null : AtomFamily<Content>
		} {
			const betweenState = betweenFamily(key)
			const cardinalityState = cardinalityFamily(key)
			const findRelationsState = createRelationFamily(`${key}:findRelation`)
			const findContentsState = (
				defaultContent
					? createContentsFamily(`${key}:findContents`, defaultContent)
					: null
			) as Content extends null ? null : AtomFamily<Content>

			setState(betweenState, between)
			setState(cardinalityState, cardinality)

			return {
				betweenState,
				cardinalityState,
				findRelationsState,
				findContentsState,
			}
		}
	})
})
