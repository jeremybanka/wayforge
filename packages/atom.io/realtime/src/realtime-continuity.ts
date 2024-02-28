import type {
	AtomFamilyToken,
	AtomToken,
	ReadableFamilyToken,
	ReadableToken,
	TransactionToken,
} from "atom.io"
import {
	IMPLICIT,
	assignTransactionToContinuity,
	getUpdateToken,
	setEpochNumberOfContinuity,
} from "atom.io/internal"
import type { Json } from "atom.io/json"

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

export type PerspectiveToken<
	F extends AtomFamilyToken<any>,
	T extends F extends AtomFamilyToken<infer T, any> ? T : never,
> = {
	type: `realtime_perspective`
	resourceAtoms: F
	viewAtoms: ReadableFamilyToken<ReadableToken<T>[], string>
}

export type ContinuityToken = {
	readonly type: `continuity`
	readonly key: string
	readonly globals: AtomToken<any>[]
	readonly actions: TransactionToken<any>[]
	readonly perspectives: PerspectiveToken<
		AtomFamilyToken<any, Json.Serializable>,
		Json.Serializable
	>[]
}

export class SyncGroup {
	protected type = `continuity` as const

	protected globals: AtomToken<any>[] = []
	protected actions: TransactionToken<any>[] = []
	protected perspectives: PerspectiveToken<any, any>[] = []

	protected constructor(protected readonly key: string) {}

	public static existing: InvariantMap<string, ContinuityToken> =
		new InvariantMap()
	public static create(
		key: string,
		builder: (group: SyncGroup) => SyncGroup,
	): ContinuityToken {
		const group = new SyncGroup(key)
		const { type, globals, actions, perspectives } = builder(group)
		const token = { type, key, globals, actions, perspectives }
		SyncGroup.existing.set(key, token)
		return token
	}

	public add(...atoms: AtomToken<any>[]): SyncGroup
	public add(...args: TransactionToken<any>[]): SyncGroup
	public add<
		F extends AtomFamilyToken<any>,
		T extends F extends AtomFamilyToken<infer T> ? T : never,
	>(
		family: AtomFamilyToken<T, any>,
		index: ReadableFamilyToken<Iterable<AtomToken<T>>, string>,
	): SyncGroup
	public add(
		...args:
			| readonly AtomToken<any>[]
			| readonly TransactionToken<any>[]
			| [AtomFamilyToken<any, any>, ReadableFamilyToken<Iterable<any>, string>]
	): SyncGroup {
		const zeroth = args[0]
		if (zeroth.type === `atom` || zeroth.type === `mutable_atom`) {
			const globals = args as AtomToken<any>[]
			for (const global of globals) {
				switch (global.type) {
					case `atom`:
						this.globals.push(global)
						break
					case `mutable_atom`:
						this.globals.push(getUpdateToken(global))
						break
				}
			}
		} else if (zeroth.type === `transaction`) {
			const actions = args as TransactionToken<any>[]
			this.actions.push(...actions)
		} else {
			const [family, index] = args as [
				AtomFamilyToken<any, any>,
				ReadableFamilyToken<ReadableToken<any>[], string>,
			]
			this.perspectives.push({
				type: `realtime_perspective`,
				resourceAtoms: family,
				viewAtoms: index,
			})
		}
		return this
	}
}

export type ContinuityOptions = {
	key: string
	config: (group: SyncGroup) => SyncGroup
}

export function continuity(options: ContinuityOptions): ContinuityToken {
	const { key, config } = options
	const token = SyncGroup.create(key, config)
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
