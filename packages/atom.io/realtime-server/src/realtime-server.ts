import type { WritableToken } from "atom.io"
import { type AtomFamily, type AtomToken, atom, atomFamily } from "atom.io"
import type { WritableState } from "atom.io/internal"
import { IMPLICIT } from "atom.io/internal"
import type { Json } from "atom.io/json"

import type {
	ActionReceiver,
	ActionSynchronizer,
	FamilyProvider,
	MutableFamilyProvider,
	MutableProvider,
	ServerConfig,
	StateProvider,
	StateReceiver,
} from "."
import {
	realtimeActionReceiver,
	realtimeActionSynchronizer,
	realtimeFamilyProvider,
	realtimeMutableFamilyProvider,
	realtimeMutableProvider,
	realtimeStateProvider,
	realtimeStateReceiver,
} from "."

export class RealtimeServer {
	protected stateProvider: StateProvider
	protected mutableProvider: MutableProvider
	protected familyProvider: FamilyProvider
	protected mutableFamilyProvider: MutableFamilyProvider
	protected stateReceiver: StateReceiver
	protected actionReceiver: ActionReceiver
	protected actionSynchronizer: ActionSynchronizer

	public constructor(config: ServerConfig) {
		const { socket, store = IMPLICIT.STORE } = config
		this.stateProvider = realtimeStateProvider({ socket })
		this.mutableProvider = realtimeMutableProvider({ socket })
		this.familyProvider = realtimeFamilyProvider({ socket })
		this.mutableFamilyProvider = realtimeMutableFamilyProvider({ socket })
		this.stateReceiver = realtimeStateReceiver({ socket, store })
		this.actionReceiver = realtimeActionReceiver({ socket, store })
		this.actionSynchronizer = realtimeActionSynchronizer({ socket, store })
	}

	public provideStates(...atoms: AtomToken<any>[]): () => void {
		const unsubscribeFunctions: (() => void)[] = []
		for (const atom of atoms) {
			const unsubscribe =
				atom.type === `atom`
					? this.stateProvider(atom)
					: this.mutableProvider(atom)
			unsubscribeFunctions.push(unsubscribe)
		}
		const unsubscribe = () => {
			for (const unsubscribeFunction of unsubscribeFunctions) {
				unsubscribeFunction()
			}
		}
		return unsubscribe
	}

	public provide(...atoms: AtomToken<any>[]): {
		provide: RealtimeServer[`provide`]
		subscribe: () => () => void
	}
	public provide<
		F extends AtomFamily<any>,
		K extends F extends AtomFamily<any, infer K> ? K : never,
	>(
		family: AtomFamily<any, K>,
		index: AtomToken<Iterable<K>>,
	): {
		provide: RealtimeServer[`provide`]
		subscribe: () => () => void
	}
	public provide<
		F extends AtomFamily<any>,
		K extends F extends AtomFamily<any, infer K> ? K : never,
	>(
		...args: AtomToken<any>[] | [AtomFamily<any, K>, AtomToken<Iterable<K>>]
	): {
		provide: RealtimeServer[`provide`]
		subscribe: () => () => void
	} {
		const subscribeFunctions: (() => () => void)[] = []
		const subscribe = () => {
			const unsubscribeFunctions: (() => void)[] = []
			const unsubscribe = () => {
				for (const unsubscribeFunction of unsubscribeFunctions) {
					unsubscribeFunction()
				}
			}
			for (const subscribeFunction of subscribeFunctions) {
				unsubscribeFunctions.push(subscribeFunction())
			}
			return unsubscribe
		}
		const provide = <
			F extends AtomFamily<any>,
			K extends F extends AtomFamily<any, infer K> ? K : never,
		>(
			...args: AtomToken<any>[] | [AtomFamily<any, K>, AtomToken<Iterable<K>>]
		): {
			provide: RealtimeServer[`provide`]
			subscribe: () => () => void
		} => {
			if (args[0].type === `atom` || args[0].type === `mutable_atom`) {
				const atoms = args as AtomToken<any>[]
				subscribeFunctions.push(() => {
					const unsubscribe = this.provideStates(...atoms)
					return unsubscribe
				})
			} else {
				const [family, index] = args
				subscribeFunctions.push(() => {
					const unsubscribe =
						family.type === `atom_family`
							? this.familyProvider(family, index)
							: this.mutableFamilyProvider(family, index)
					return unsubscribe
				})
			}
			return { provide, subscribe }
		}
		return provide(...args)
	}
}

// const server = new RealtimeServer({ socket: io() })

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

// server.socket.on(`init`, (subKey, value) => {
// 	const unsubscribe = server
// 		.provide(counterStates, counterIndex)
// 		.provide(nameStates, nameIndex)
// 		.provide(nameIndex, counterIndex)
// 		.subscribe()
// 	socket.on
// })
