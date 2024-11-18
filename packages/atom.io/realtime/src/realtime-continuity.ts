import type {
	AtomFamilyToken,
	AtomToken,
	Compound,
	MutableAtomFamilyToken,
	ReadableFamilyToken,
	ReadableToken,
	RegularAtomFamilyToken,
	Tag,
	TransactionToken,
	WritableSelectorFamilyToken,
	WritableToken,
} from "atom.io"
import type { Transceiver } from "atom.io/internal"
import {
	assignTransactionToContinuity,
	IMPLICIT,
	setEpochNumberOfContinuity,
} from "atom.io/internal"
import type { Json, JsonIO } from "atom.io/json"
import { fromEntries } from "atom.io/json"
import type { UserKey } from "atom.io/realtime-server"

import type {
	Actual,
	Alias,
	AnyActualKey,
	AnyAliasKey,
	ToActual,
	ToAlias,
} from "./realtime-occlusion-store"

/* eslint-disable no-console */

export class InvariantMap<K, V> extends Map<K, V> {
	public set(key: K, value: V): this {
		if (this.has(key)) {
			console.warn(`Tried to set a key that already exists in an InvariantMap`, {
				key,
				value,
			})
			return this
		}
		return super.set(key, value)
	}

	public clear(): void {
		throw new Error(`Cannot clear an InvariantMap`)
	}
}

export type DynamicToken<K extends string> = {
	type: `realtime_dynamic`
	resourceFamilies: AtomFamilyToken<any, K>[]
	viewState: ReadableToken<Iterable<K>>
}

export type ContinuityToken = {
	readonly type: `continuity`
	readonly key: string
	readonly globals: AtomToken<any>[]
	readonly actions: TransactionToken<JsonIO>[]
	readonly dynamics: DynamicToken<any>[]
	readonly perspectives: PerspectiveToken<AnyAliasKey>[]
	readonly masksPerFamily: { [key: string]: MaskData }
}

export type MutableMaskToken<
	K extends AnyAliasKey,
	J extends Json.Serializable = Json.Serializable,
	S extends Json.Serializable = Json.Serializable,
	BaseStates extends MutableAtomFamilyToken<
		Transceiver<S>,
		J,
		string
	> = MutableAtomFamilyToken<Transceiver<S>, J, string>,
	MaskedStates extends WritableSelectorFamilyToken<
		any,
		string
	> = WritableSelectorFamilyToken<any, string>,
	SignalMaskedStates extends WritableSelectorFamilyToken<
		any,
		string
	> = WritableSelectorFamilyToken<any, string>,
> = [
	baseStates: BaseStates extends MutableAtomFamilyToken<
		Transceiver<S>,
		J,
		infer BaseKey
	>
		? ToActual<K> extends BaseKey
			? BaseStates
			: never
		: never,
	jsonMask: MaskedStates extends WritableSelectorFamilyToken<any, infer JsonKey>
		? Compound<Tag<`mask`>, UserKey, ToActual<K>> extends JsonKey
			? MaskedStates
			: never
		: never,
	signalMask: SignalMaskedStates extends WritableSelectorFamilyToken<
		any,
		infer SignalKey
	>
		? Compound<Tag<`mask`>, UserKey, ToActual<K>> extends SignalKey
			? SignalMaskedStates
			: never
		: never,
]
export type RegularMaskToken<
	K extends AnyAliasKey,
	BaseStates extends RegularAtomFamilyToken<
		any,
		K | ToActual<K>
	> = RegularAtomFamilyToken<any, K | ToActual<K>>,
	MaskedStates extends WritableSelectorFamilyToken<
		any,
		string
	> = WritableSelectorFamilyToken<
		any,
		Compound<Tag<`mask`>, UserKey<Actual>, ToActual<K>>
	>,
> = [
	baseStates: BaseStates extends RegularAtomFamilyToken<any, infer BaseKey>
		? ToActual<K> extends BaseKey
			? BaseStates
			: never
		: never,
	maskStates: MaskedStates extends WritableSelectorFamilyToken<
		any,
		Compound<Tag<`mask`>, UserKey<Actual>, infer MaskKey>
	>
		? ToActual<K> extends MaskKey
			? MaskedStates
			: never
		: never,
]

export type AnyMaskToken<K extends AnyAliasKey> =
	| MutableMaskToken<K>
	| RegularMaskToken<K>
export type MaskData =
	| {
			type: `mutable`
			mask: WritableSelectorFamilyToken<any, string>
			signal: WritableSelectorFamilyToken<any, string>
	  }
	| {
			type: `regular`
			mask: WritableSelectorFamilyToken<any, string>
	  }

export type PerspectiveToken<K extends AnyAliasKey> = {
	type: `realtime_perspective`
	resourceFamilies: AnyMaskToken<K>[]
	userViewAtoms: ReadableFamilyToken<
		Iterable<[actual: ToActual<K>, alias: K]>,
		UserKey
	>
}

export class Continuity {
	public type = `continuity` as const

	protected _globals: AtomToken<any>[] = []
	protected _actions: TransactionToken<any>[] = []
	protected _dynamics: DynamicToken<any>[] = []
	protected _perspectives: PerspectiveToken<any>[] = []

	protected constructor(protected readonly key: string) {}

	public static existing: InvariantMap<string, ContinuityToken> =
		new InvariantMap()

	// public masks: InvariantMap<string
	public static create(
		key: string,
		builder: (group: Continuity) => Continuity,
	): ContinuityToken {
		const group = new Continuity(key)
		const {
			type,
			_globals: globals,
			_actions: actions,
			_dynamics: dynamics,
			_perspectives: perspectives,
		} = builder(group)
		const masksPerFamily = fromEntries(
			perspectives.flatMap((perspective): [string, MaskData][] => {
				const { resourceFamilies } = perspective
				return resourceFamilies.map(
					([baseFamily, maskFamily, signalFamily]): [string, MaskData] => {
						if (signalFamily) {
							return [
								baseFamily.key,
								{ type: `mutable`, mask: maskFamily, signal: signalFamily },
							]
						}
						return [baseFamily.key, { type: `regular`, mask: maskFamily }]
					},
				)
			}),
		)
		const token = {
			type,
			key,
			globals,
			actions,
			dynamics,
			perspectives,
			masksPerFamily,
		}
		Continuity.existing.set(key, token)
		return token
	}

	public globals(...atoms: AtomToken<any>[]): Continuity
	public globals(...args: readonly AtomToken<any>[]): this {
		this._globals.push(...(args as AtomToken<any>[]))
		return this
	}
	public actions(
		...args: readonly TransactionToken<
			(userKey: UserKey<Actual>, ...rest: Json.Array) => any
		>[]
	): Continuity
	public actions(...args: readonly TransactionToken<any>[]): this {
		this._actions.push(...(args as TransactionToken<any>[]))
		return this
	}

	public dynamic<K extends string>(
		index: ReadableToken<Iterable<K>>,
		...families: AtomFamilyToken<any, K>[]
	): this {
		this._dynamics.push({
			type: `realtime_dynamic`,
			resourceFamilies: families,
			viewState: index,
		})

		return this
	}

	public perspective<K extends AnyAliasKey>(
		index: ReadableFamilyToken<
			Iterable<[actual: ToActual<K>, alias: K]>,
			UserKey
		>,
		...maskedFamilies: AnyMaskToken<NoInfer<K>>[]
	): this {
		this._perspectives.push({
			type: `realtime_perspective`,
			resourceFamilies: maskedFamilies,
			userViewAtoms: index,
		})
		return this
	}
}

export type ContinuityOptions = {
	key: string
	config: (group: Continuity) => Continuity
}

export function continuity(options: ContinuityOptions): ContinuityToken {
	const { key, config } = options
	const token = Continuity.create(key, config)
	const { actions } = token
	for (const action of actions) {
		assignTransactionToContinuity(key, action.key, IMPLICIT.STORE)
	}
	setEpochNumberOfContinuity(key, -1, IMPLICIT.STORE)
	return token
}

// const counterStates = atomFamily<number, { c: string }>({
// 	key: `counter`,
// 	default: 0,
// })
// const counterIndices = atomFamily<{ c: string }[], string>({
// 	key: `counterIndex`,
// 	default: [],
// })
// const nameStates = atomFamily<number, { n: string }>({
// 	key: `name`,
// 	default: 0,
// })
// const nameIndices = atomFamily<{ n: string }[], string>({
// 	key: `nameIndex`,
// 	default: [],
// })

// const counterContinuity = continuity({
// 	key: `counter`,
// 	config: (group) =>
// 		group
// 			.add(counterStates, counterIndices)
// 			.add(nameStates, nameIndices)
// 			.add(nameStates, nameIndices)
// 			.add(nameStates, nameIndices),
// })
