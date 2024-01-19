import type {
	AtomFamilyToken,
	AtomToken,
	ReadableFamilyToken,
	TransactionToken,
} from "atom.io"

export type AtomFamilyPerspective<
	F extends AtomFamilyToken<any>,
	K extends F extends AtomFamilyToken<any, infer K> ? K : never,
> = {
	resourceAtoms: F
	perspectiveAtoms: ReadableFamilyToken<Iterable<K>, string>
}

export type SyncGroupToken = {
	readonly type: `realtime_sync_group`
	readonly globals: AtomToken<any>[]
	readonly actions: TransactionToken<any>[]
	readonly perspectives: AtomFamilyPerspective<any, any>[]
}

export class SyncGroup implements SyncGroupToken {
	public type = `realtime_sync_group` as const

	public globals: AtomToken<any>[]
	public actions: TransactionToken<any>[]
	public perspectives: AtomFamilyPerspective<any, any>[]

	private constructor() {}

	public static create(
		builder: (group: SyncGroup) => SyncGroupToken,
	): SyncGroupToken {
		const group = new SyncGroup()
		const { type, globals, actions, perspectives } = builder(group)
		return { type, globals, actions, perspectives }
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
			this.perspectives.push({ resourceAtoms: family, perspectiveAtoms: index })
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
