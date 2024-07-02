import type {
	getState,
	MoleculeConstructor,
	MoleculeFamilyToken,
	MoleculeToken,
	ReadableFamilyToken,
	ReadableToken,
	ReaderToolkit,
	WritableFamilyToken,
	WritableToken,
	WriterToolkit,
} from "atom.io"
import type { Json } from "atom.io/json"

import {
	composeFindState,
	composeSeekState,
	findInStore,
	seekInStore,
} from "../families"
import { composeGetState, getFromStore } from "../get-state"
import { readOrComputeValue } from "../get-state/read-or-compute-value"
import { newest } from "../lineage"
import { composeGetJsonToken } from "../mutable"
import { NotFoundError } from "../not-found-error"
import { setAtomOrSelector } from "../set-state"
import type { Store } from "../store"
import { withdraw } from "../store"
import { updateSelectorAtoms } from "./update-selector-atoms"

export class ReadonlySelectorToolkit implements ReaderToolkit {
	public constructor(
		selectorKey: string,
		covered: Set<string>,
		store: Store,
		public readonly find = composeFindState(store),
		public readonly seek = composeSeekState(store),
		public readonly json = composeGetJsonToken(store),
		public readonly get = (
			...params:
				| [MoleculeFamilyToken<any>, Json.Serializable]
				| [MoleculeToken<MoleculeConstructor>]
				| [ReadableFamilyToken<any, any>, Json.Serializable]
				| [ReadableToken<any>]
		): ReturnType<typeof getState> => {
			const target = newest(store)
			let dependency: MoleculeToken<MoleculeConstructor> | ReadableToken<any>

			if (params.length === 2) {
				const [family, key] = params
				switch (family.type) {
					case `molecule_family`:
						return getFromStore(family, key, target)
					default:
						dependency = seekInStore(family, key, target) as any
				}
			} else {
				;[dependency] = params
			}

			if (dependency.type === `molecule`) {
				return getFromStore(dependency, target)
			}

			const dependencyState = withdraw(dependency, target)
			const dependencyValue = readOrComputeValue(dependencyState, target)

			store.logger.info(
				`🔌`,
				`selector`,
				selectorKey,
				`registers dependency ( "${dependency.key}" =`,
				dependencyValue,
				`)`,
			)

			target.selectorGraph.set(
				{
					upstreamSelectorKey: dependency.key,
					downstreamSelectorKey: selectorKey,
				},
				{
					source: dependency.key,
				},
			)
			updateSelectorAtoms(selectorKey, dependency as any, covered, store)
			return dependencyValue
		},
	) {}
}

export class WritableSelectorToolkit implements WriterToolkit {
	public constructor(
		readerToolkit: ReadonlySelectorToolkit,
		store: Store,
		public readonly find = readerToolkit.find,
		public readonly seek = readerToolkit.seek,
		public readonly json = readerToolkit.json,
		public readonly get = composeGetState(store),
		public set = <T, New extends T>(
			...params:
				| [
						token: WritableFamilyToken<T, any>,
						key: Json.Serializable,
						value: New | ((oldValue: any) => New),
				  ]
				| [token: WritableToken<T>, value: New | ((oldValue: T) => New)]
		): void => {
			let token: WritableToken<T>
			let value: New | ((oldValue: T) => New)
			if (params.length === 2) {
				token = params[0]
				value = params[1]
			} else {
				const family = params[0]
				const key = params[1]
				value = params[2]
				const maybeToken =
					store.config.lifespan === `ephemeral`
						? findInStore(family, key, store)
						: seekInStore(family, key, store)
				if (!maybeToken) {
					throw new NotFoundError(family, key, store)
				}
				token = maybeToken
			}
			const target = newest(store)
			const state = withdraw(token, target)
			setAtomOrSelector(state, value, target)
		},
	) {}
}
