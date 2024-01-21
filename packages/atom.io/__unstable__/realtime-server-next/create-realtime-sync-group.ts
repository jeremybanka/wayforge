import type {
	AtomFamilyToken,
	AtomToken,
	ReadableFamilyToken,
	TransactionToken,
} from "atom.io"
import { IMPLICIT } from "atom.io/internal"

export class InvariantMap<K, V> extends Map<K, V> {
	public set(key: K, value: V): this {
		if (this.has(key)) {
			throw new Error(`Cannot set a key that already exists in an InvariantMap`)
		}
		return super.set(key, value)
	}

	public clear(): void {
		throw new Error(`Cannot clear an InvariantMap`)
	}
}

export type PerspectiveToken<
	F extends AtomFamilyToken<any>,
	K extends F extends AtomFamilyToken<any, infer K> ? K : never,
> = {
	type: `realtime_perspective`
	resourceAtoms: F
	perspectiveAtoms: ReadableFamilyToken<Iterable<K>, string>
}

export type SyncGroupToken = {
	readonly type: `realtime_sync_group`
	readonly key: string
	readonly globals: AtomToken<any>[]
	readonly actions: TransactionToken<any>[]
	readonly perspectives: PerspectiveToken<any, any>[]
}

export class SyncGroup implements SyncGroupToken {
	public type = `realtime_sync_group` as const

	public globals: AtomToken<any>[]
	public actions: TransactionToken<any>[]
	public perspectives: PerspectiveToken<any, any>[]

	private constructor(public readonly key: string) {}

	public static existing: InvariantMap<string, SyncGroupToken> =
		new InvariantMap()
	public static create(
		key: string,
		builder: (group: SyncGroup) => SyncGroupToken,
	): SyncGroupToken {
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
		K extends F extends AtomFamilyToken<any, infer K> ? K : never,
	>(
		family: AtomFamilyToken<any, K>,
		index: ReadableFamilyToken<Iterable<K>, string>,
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
			this.globals.push(...globals)
		} else if (zeroth.type === `transaction`) {
			const actions = args as TransactionToken<any>[]
			this.actions.push(...actions)
		} else {
			const [family, index] = args as [
				AtomFamilyToken<any, any>,
				ReadableFamilyToken<Iterable<any>, string>,
			]
			this.perspectives.push({
				type: `realtime_perspective`,
				resourceAtoms: family,
				perspectiveAtoms: index,
			})
		}
		return this
	}
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

// const group = SyncGroup.create((syncGroup) =>
// 	syncGroup.add(counterStates, counterIndices).add(nameStates, nameIndices),
// )
