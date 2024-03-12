import type { AtomFamily, AtomToken } from "atom.io"
import { IMPLICIT } from "atom.io/internal"

import type {
	ActionReceiver,
	// ActionSynchronizer,
	FamilyProvider,
	MutableFamilyProvider,
	MutableProvider,
	ServerConfig,
	StateProvider,
	StateReceiver,
} from "atom.io/realtime-server"
import {
	realtimeActionReceiver,
	// realtimeActionSynchronizer,
	realtimeAtomFamilyProvider,
	realtimeMutableFamilyProvider,
	realtimeMutableProvider,
	realtimeStateProvider,
	realtimeStateReceiver,
} from "atom.io/realtime-server"

export class RealtimeServer {
	protected stateProvider: StateProvider
	protected mutableProvider: MutableProvider
	protected familyProvider: FamilyProvider
	protected mutableFamilyProvider: MutableFamilyProvider
	protected stateReceiver: StateReceiver
	protected actionReceiver: ActionReceiver
	// protected actionSynchronizer: ActionSynchronizer

	public constructor(config: ServerConfig) {
		const { socket, store = IMPLICIT.STORE } = config
		this.stateProvider = realtimeStateProvider({ socket })
		this.mutableProvider = realtimeMutableProvider({ socket })
		this.familyProvider = realtimeAtomFamilyProvider({ socket })
		this.mutableFamilyProvider = realtimeMutableFamilyProvider({ socket })
		this.stateReceiver = realtimeStateReceiver({ socket, store })
		this.actionReceiver = realtimeActionReceiver({ socket, store })
		// this.actionSynchronizer = realtimeActionSynchronizer({ socket, store })
	}

	public provideStates(...atoms: AtomToken<any>[]): () => void {
		const retractFunctions: (() => void)[] = []
		for (const atom of atoms) {
			const unsubscribe =
				atom.type === `atom`
					? this.stateProvider(atom)
					: this.mutableProvider(atom)
			retractFunctions.push(unsubscribe)
		}
		const retract = () => {
			for (const retractFunction of retractFunctions) {
				retractFunction()
			}
		}
		return retract
	}

	public provide(...atoms: AtomToken<any>[]): {
		provide: RealtimeServer[`provide`]
		subscribe: () => () => void
	}
	public provide<
		F extends AtomFamily<any>,
		K extends F extends AtomFamily<any, infer Key> ? Key : never,
	>(
		family: AtomFamily<any, K>,
		index: AtomToken<Iterable<K>>,
	): {
		provide: RealtimeServer[`provide`]
		subscribe: () => () => void
	}
	public provide<
		F extends AtomFamily<any>,
		K extends F extends AtomFamily<any, infer Key> ? Key : never,
	>(
		...params: AtomToken<any>[] | [AtomFamily<any, K>, AtomToken<Iterable<K>>]
	): {
		provide: RealtimeServer[`provide`]
		subscribe: () => () => void
	} {
		const subscribeFunctions: (() => () => void)[] = []
		const subscribe = () => {
			const retractFunctions = subscribeFunctions.map((subscribeFunction) =>
				subscribeFunction(),
			)
			const retract = () => {
				for (const retractFunction of retractFunctions) {
					retractFunction()
				}
			}
			return retract
		}
		const provide = <
			Family extends AtomFamily<any>,
			Key extends Family extends AtomFamily<any, infer FamilyKey>
				? FamilyKey
				: never,
		>(
			...args:
				| AtomToken<any>[]
				| [AtomFamily<any, Key>, AtomToken<Iterable<Key>>]
		): {
			provide: RealtimeServer[`provide`]
			subscribe: () => () => void
		} => {
			if (args[0].type === `atom` || args[0].type === `mutable_atom`) {
				const atoms = args as AtomToken<any>[]
				subscribeFunctions.push(() => {
					const retract = this.provideStates(...atoms)
					return retract
				})
			} else {
				const [family, index] = args
				subscribeFunctions.push(() => {
					const retract =
						family.type === `atom_family`
							? this.familyProvider(family, index)
							: this.mutableFamilyProvider(family, index)
					return retract
				})
			}
			return { provide, subscribe }
		}
		return provide(...params)
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
// 	const retract = server
// 		.provide(counterStates, counterIndex)
// 		.provide(nameStates, nameIndex)
// 		.provide(nameIndex, counterIndex)
// 		.subscribe()
// 	socket.on
// })
