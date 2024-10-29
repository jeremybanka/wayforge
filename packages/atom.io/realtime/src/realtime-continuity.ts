import type {
	AtomFamilyToken,
	AtomToken,
	ReadableFamilyToken,
	ReadableToken,
	TokenType,
	TransactionToken,
} from "atom.io"
import {
	assignTransactionToContinuity,
	IMPLICIT,
	setEpochNumberOfContinuity,
} from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import type { UserKey } from "atom.io/realtime-server"

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

export type PerspectiveToken<F extends AtomFamilyToken<any>> = {
	type: `realtime_perspective`
	resourceAtoms: F
	viewAtoms: ReadableFamilyToken<ReadableToken<TokenType<F>>[], UserKey>
}

export type ContinuityToken = {
	readonly type: `continuity`
	readonly key: string
	readonly globals: AtomToken<any>[]
	readonly actions: TransactionToken<any>[]
	readonly perspectives: PerspectiveToken<AtomFamilyToken<any, Canonical>>[]
}

export class Continuity {
	public type = `continuity` as const

	protected globals: AtomToken<any>[] = []
	protected actions: TransactionToken<any>[] = []
	protected perspectives: PerspectiveToken<any>[] = []

	protected constructor(protected readonly key: string) {}

	public static existing: InvariantMap<string, ContinuityToken> =
		new InvariantMap()
	public static create(
		key: string,
		builder: (group: Continuity) => Continuity,
	): ContinuityToken {
		const group = new Continuity(key)
		const { type, globals, actions, perspectives } = builder(group)
		const token = { type, key, globals, actions, perspectives }
		Continuity.existing.set(key, token)
		return token
	}

	public add(...atoms: AtomToken<any>[]): Continuity
	public add(...args: TransactionToken<any>[]): Continuity
	public add<
		F extends AtomFamilyToken<any>,
		T extends F extends AtomFamilyToken<infer U> ? U : never,
	>(
		family: AtomFamilyToken<T, any>,
		index: ReadableFamilyToken<Iterable<AtomToken<T>>, UserKey>,
	): Continuity
	public add(
		...args:
			| readonly AtomToken<any>[]
			| readonly TransactionToken<any>[]
			| [AtomFamilyToken<any, any>, ReadableFamilyToken<Iterable<any>, string>]
	): this {
		const zeroth = args[0]
		switch (zeroth.type) {
			case `atom`:
			case `mutable_atom`:
				this.globals.push(...(args as AtomToken<any>[]))
				break
			case `transaction`:
				this.actions.push(...(args as TransactionToken<any>[]))
				break
			case `atom_family`:
				{
					const [family, index] = args as [
						AtomFamilyToken<any, any>,
						ReadableFamilyToken<ReadableToken<any>[], UserKey>,
					]
					this.perspectives.push({
						type: `realtime_perspective`,
						resourceAtoms: family,
						viewAtoms: index,
					})
				}
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
