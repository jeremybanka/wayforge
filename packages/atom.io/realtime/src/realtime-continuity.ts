import type {
	AtomFamilyToken,
	AtomToken,
	MutableAtomFamilyToken,
	ReadableFamilyToken,
	ReadableToken,
	RegularAtomFamilyToken,
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

import type { Actual, Alias } from "./realtime-occlusion-store"

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
	viewState: WritableToken<Iterable<K>>
}

export type PerspectiveToken<KeyType extends string> = {
	type: `realtime_perspective`
	resourceFamilies: MaskToken<KeyType, any, any>[]
	userViewAtoms: ReadableFamilyToken<Iterable<`${KeyType}::${Alias}`>, UserKey>
}

export type ContinuityToken = {
	readonly type: `continuity`
	readonly key: string
	readonly globals: AtomToken<any>[]
	readonly actions: TransactionToken<JsonIO>[]
	readonly dynamics: DynamicToken<any>[]
	readonly perspectives: PerspectiveToken<string>[]
	readonly masksPerFamily: { [key: string]: MaskData }
}

export type MaskToken<
	KeyType extends string,
	JsonForm extends Json.Serializable,
	JsonUpdate extends Json.Serializable,
> =
	| [
			baseStates: MutableAtomFamilyToken<
				Transceiver<JsonUpdate>,
				JsonForm,
				`${KeyType}::${string}`
			>,
			jsonMask: WritableSelectorFamilyToken<
				NoInfer<JsonForm>,
				`${KeyType}::${string}`
			>,
			signalMask: WritableSelectorFamilyToken<
				NoInfer<JsonUpdate>,
				`${KeyType}::${string}`
			>,
	  ]
	| [
			baseStates: RegularAtomFamilyToken<any, `${KeyType}::${string}`>,
			maskStates: WritableSelectorFamilyToken<any, `${KeyType}::${string}`>,
	  ]
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

export class Continuity {
	public type = `continuity` as const

	protected globals: AtomToken<any>[] = []
	protected actions: TransactionToken<any>[] = []
	protected dynamics: DynamicToken<any>[] = []
	protected perspectives: PerspectiveToken<any>[] = []

	protected constructor(protected readonly key: string) {}

	public static existing: InvariantMap<string, ContinuityToken> =
		new InvariantMap()

	// public masks: InvariantMap<string
	public static create(
		key: string,
		builder: (group: Continuity) => Continuity,
	): ContinuityToken {
		const group = new Continuity(key)
		const { type, globals, actions, dynamics, perspectives } = builder(group)
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

	public add(...atoms: AtomToken<any>[]): Continuity
	public add(
		...args: TransactionToken<
			(userKey: UserKey<Actual>, ...rest: Json.Array) => any
		>[]
	): Continuity
	public add<K extends string>(
		index: ReadableToken<Iterable<K>>,
		...families: AtomFamilyToken<any, K>[]
	): Continuity
	public add<
		KeyType extends string,
		JsonForm extends Json.Serializable,
		JsonUpdate extends Json.Serializable,
	>(
		index: ReadableFamilyToken<Iterable<`${KeyType}::${string}`>, UserKey>,
		...maskedFamilies: MaskToken<KeyType, JsonForm, JsonUpdate>[]
	): Continuity
	public add(
		...args:
			| readonly [
					index: ReadableFamilyToken<Iterable<any>, UserKey>,
					...maskedFamilies: MaskToken<any, any, any>[],
			  ]
			| readonly [
					index: ReadableToken<Iterable<any>>,
					...families: AtomFamilyToken<any, any>[],
			  ]
			| readonly AtomToken<any>[]
			| readonly TransactionToken<any>[]
	): this {
		const first = args[1]
		if (Array.isArray(first)) {
			const [index, ...maskedFamilies] = args as readonly [
				index: ReadableFamilyToken<Iterable<any>, UserKey>,
				...maskedFamilies: MaskToken<any, any, any>[],
			]
			this.perspectives.push({
				type: `realtime_perspective`,
				resourceFamilies: maskedFamilies,
				userViewAtoms: index,
			})
			return this
		}
		if (first) {
			switch (first.type) {
				case `atom_family`:
				case `mutable_atom_family`:
					{
						const [index, ...families] = args as [
							index: WritableToken<Iterable<any>>,
							...families: AtomFamilyToken<any, any>[],
						]
						this.dynamics.push({
							type: `realtime_dynamic`,
							resourceFamilies: families,
							viewState: index,
						})
					}
					return this
			}
		}
		const zeroth = args[0]
		switch (zeroth.type) {
			case `atom`:
			case `mutable_atom`:
				this.globals.push(...(args as AtomToken<any>[]))
				break
			case `transaction`:
				this.actions.push(...(args as TransactionToken<any>[]))
				break
		}

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
