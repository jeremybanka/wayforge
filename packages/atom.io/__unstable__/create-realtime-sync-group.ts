import type { AtomFamilyToken, AtomToken, TransactionToken } from "atom.io"
import type { Json } from "atom.io/json"

export type FamilyPerspective<K extends Json.Serializable> = (
	clientId: string,
) => AtomToken<Iterable<K>>
export type FamilySyncConfig<
	F extends AtomFamilyToken<any>,
	K extends F extends AtomFamilyToken<any, infer K> ? K : never,
> = {
	atomFamily: F
	getRevealedKeysState: (clientId: string) => AtomToken<Iterable<K>>
}

export class SyncGroup {
	public globals: AtomToken<any>[] = []
	public actions: TransactionToken<any>[] = []
	public families: FamilySyncConfig<any, any>[] = []

	public add(...atoms: AtomToken<any>[]): SyncGroup
	public add(...args: TransactionToken<any>[]): SyncGroup
	public add<
		F extends AtomFamilyToken<any>,
		K extends F extends AtomFamilyToken<any, infer K> ? K : never,
	>(
		family: AtomFamilyToken<any, K>,
		index: (clientId: string) => AtomToken<any>,
	): SyncGroup
	public add(
		...args:
			| readonly AtomToken<any>[]
			| readonly TransactionToken<any>[]
			| [AtomFamilyToken<any, any>, FamilyPerspective<any>]
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
				FamilyPerspective<any>,
			]
			this.families.push({ atomFamily: family, getRevealedKeysState: index })
		}
		return this
	}
}

// const counterStates = atomFamily<number, { c: string }>({
// 	key: `counter`,
// 	default: 0,
// })
// const counterIndex = atom<{ c: string }[]>({
// 	key: `counterIndex`,
// 	default: [],
// })
// const nameStates = atomFamily<number, { n: string }>({
// 	key: `name`,
// 	default: 0,
// })
// const nameIndex = atom<{ n: string }[]>({
// 	key: `nameIndex`,
// 	default: [],
// })

// const group = new SyncGroup()
// 	.add(counterStates, () => counterIndex)
// 	.add(nameStates, () => nameIndex)
// 	.add(counterIndex)
