import type {
	AtomFamilyToken,
	AtomToken,
	Compound,
	MutableAtomFamilyToken,
	ReadableFamilyToken,
	ReadableToken,
	ReadonlySelectorFamilyToken,
	RegularAtomFamilyToken,
	Tag,
	TransactionToken,
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
	AnyAliasKey,
	MaskKey,
	ToActual,
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
	MaskedStates extends ReadonlySelectorFamilyToken<
		any,
		string
	> = ReadonlySelectorFamilyToken<any, string>,
	SignalMaskedStates extends ReadonlySelectorFamilyToken<
		any,
		string
	> = ReadonlySelectorFamilyToken<any, string>,
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
	jsonMask: MaskedStates extends ReadonlySelectorFamilyToken<any, infer JsonKey>
		? MaskKey<ToActual<K>> extends JsonKey
			? MaskedStates
			: never
		: never,
	signalMask: SignalMaskedStates extends ReadonlySelectorFamilyToken<
		any,
		infer SignalKey
	>
		? MaskKey<ToActual<K>> extends SignalKey
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
	MaskedStates extends ReadonlySelectorFamilyToken<
		any,
		string
	> = ReadonlySelectorFamilyToken<
		any,
		Compound<Tag<`mask`>, UserKey<Actual>, ToActual<K>>
	>,
> = [
	baseStates: BaseStates extends RegularAtomFamilyToken<any, infer BaseKey>
		? ToActual<K> extends BaseKey
			? BaseStates
			: never
		: never,
	maskStates: MaskedStates extends ReadonlySelectorFamilyToken<any, infer Masked>
		? MaskKey<ToActual<K>> extends Masked
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
			mask: ReadonlySelectorFamilyToken<any, string>
			signal: ReadonlySelectorFamilyToken<any, string>
	  }
	| {
			type: `regular`
			mask: ReadonlySelectorFamilyToken<any, string>
	  }

export type PerspectiveToken<K extends AnyAliasKey> = {
	type: `realtime_perspective`
	resourceFamilies: AnyMaskToken<K>[]
	userViewAtoms: ReadableFamilyToken<
		Iterable<[actual: ToActual<K>, alias: K]>,
		UserKey
	>
}

export type MaskedMutableResourceToken<
	K extends string,
	J extends Json.Serializable,
	S extends Json.Serializable,
> = {
	base: MutableAtomFamilyToken<Transceiver<S>, J, K>
	jsonMask: ReadonlySelectorFamilyToken<NoInfer<J>, MaskKey<K>>
	signalMask: ReadonlySelectorFamilyToken<NoInfer<S>, MaskKey<K>>
}
export type MaskedRegularResourceToken<K extends string> = {
	base: RegularAtomFamilyToken<any, K>
	mask: ReadonlySelectorFamilyToken<any, MaskKey<K>>
}

export type DynamicResourceToken<K extends string> =
	| AtomFamilyToken<any, K>
	| MaskedMutableResourceToken<K, any, any>
	| MaskedRegularResourceToken<K>

export type DynamicToken<K extends string> = {
	type: `realtime_dynamic`
	dynamicResources: DynamicResourceToken<K>[]
	globalIndexToken: ReadableToken<Iterable<K>>
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

	public globals(...atoms: AtomToken<any>[]): this {
		this._globals.push(...atoms)
		return this
	}

	public actions(
		...txTokens: readonly TransactionToken<
			(userKey: UserKey<Actual>, ...rest: Json.Array) => any
		>[]
	): this {
		this._actions.push(...txTokens)
		return this
	}

	public dynamic<K extends string>(
		index: ReadableToken<Iterable<K>>,
		...families: DynamicResourceToken<K>[]
	): this {
		this._dynamics.push({
			type: `realtime_dynamic`,
			dynamicResources: families,
			globalIndexToken: index,
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
