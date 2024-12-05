import type {
	AtomFamilyToken,
	AtomToken,
	Compound,
	MutableAtomFamilyToken,
	MutableAtomToken,
	ReadableFamilyToken,
	ReadableToken,
	ReadonlySelectorFamilyToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
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
	readonly actions: TransactionToken<JsonIO>[]
	readonly singletonStates: AtomToken<any, any>[]
	readonly singletonStatesMasked: MaskedSingletonResourceToken[]
	readonly dynamicStates: DynamicToken<any>[]
	readonly dynamicStatesMasked: MaskedDynamicToken<any>[]
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

export type MaskedSingletonTokensMutable<
	J extends Json.Serializable,
	S extends Json.Serializable,
> = {
	base: MutableAtomToken<Transceiver<S>, J>
	jsonMask: ReadonlySelectorFamilyToken<NoInfer<J>, UserKey<Actual>>
	signalMask: ReadonlySelectorFamilyToken<NoInfer<S>, UserKey<Actual>>
}
export type MaskedSingletonTokensRegular = {
	base: RegularAtomToken<any>
	mask: ReadonlySelectorFamilyToken<any, UserKey<Actual>>
}
export type MaskedSingletonResourceToken =
	| MaskedSingletonTokensMutable<any, any>
	| MaskedSingletonTokensRegular

export type MaskedDynamicResourceTokensMutable<
	K extends string,
	J extends Json.Serializable,
	S extends Json.Serializable,
> = {
	base: MutableAtomFamilyToken<Transceiver<S>, J, K>
	jsonMask: ReadonlySelectorFamilyToken<NoInfer<J>, MaskKey<K>>
	signalMask: ReadonlySelectorFamilyToken<NoInfer<S>, MaskKey<K>>
}
export type MaskedDynamicResourceTokensRegular<K extends string> = {
	base: RegularAtomFamilyToken<any, K>
	mask: ReadonlySelectorFamilyToken<any, MaskKey<K>>
}
export type MaskedDynamicResourceToken<K extends string> =
	| MaskedDynamicResourceTokensMutable<K, any, any>
	| MaskedDynamicResourceTokensRegular<K>

export type MaskedDynamicToken<K extends string> = {
	type: `realtime_dynamic_masked`
	globalIndexToken: ReadableToken<Iterable<K>>
	dynamicResources: MaskedDynamicResourceToken<K>[]
}

export type DynamicToken<K extends string> = {
	type: `realtime_dynamic`
	globalIndexToken: ReadableToken<Iterable<K>>
	dynamicResources: AtomFamilyToken<any, K>[]
}

export class Continuity {
	public type = `continuity` as const

	protected _actions: TransactionToken<any>[] = []
	protected _singletons: AtomToken<any, any>[] = []
	protected _singletonsMasked: MaskedSingletonResourceToken[] = []
	protected _dynamics: DynamicToken<any>[] = []
	protected _dynamicsMasked: MaskedDynamicToken<any>[] = []
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
			_actions: actions,
			_singletons: singletonStates,
			_singletonsMasked: singletonStatesMasked,
			_dynamics: dynamicStates,
			_dynamicsMasked: dynamicStatesMasked,
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
		const token: ContinuityToken = {
			type,
			key,
			actions,
			singletonStates,
			singletonStatesMasked,
			dynamicStates,
			dynamicStatesMasked,
			perspectives,
			masksPerFamily,
		}
		Continuity.existing.set(key, token)
		return token
	}

	public actions(
		...txTokens: readonly TransactionToken<
			(userKey: UserKey<Actual>, ...rest: Json.Array) => any
		>[]
	): this {
		this._actions.push(...txTokens)
		return this
	}

	public globals(...atoms: AtomToken<any>[]): this {
		this._singletons.push(...atoms)
		return this
	}

	public dynamic<K extends string>(
		globalIndexToken: ReadableToken<Iterable<K>>,
		...families: AtomFamilyToken<any, K>[]
	): this {
		this._dynamics.push({
			type: `realtime_dynamic`,
			globalIndexToken,
			dynamicResources: families,
		})

		return this
	}

	public maskedDynamic<K extends string>(
		globalIndexToken: ReadableToken<Iterable<K>>,
		...families: MaskedDynamicResourceToken<K>[]
	): this {
		this._dynamicsMasked.push({
			type: `realtime_dynamic_masked`,
			globalIndexToken,
			dynamicResources: families,
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
