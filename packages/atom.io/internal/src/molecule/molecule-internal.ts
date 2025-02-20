import type {
	MoleculeToken,
	ReadableToken,
	StateCreation,
	StateDisposal,
} from "atom.io"
import type { Canonical, stringified } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import type { Store } from "../store"
import { Subject } from "../subject"

// export class Molecule<K extends Canonical> implements MoleculeToken<K> {
// 	public readonly type = `molecule`
// 	public readonly key: K
// 	public stringKey: stringified<K>
// 	private _dependsOn: `all` | `any`
// 	public get dependsOn(): `all` | `any` {
// 		return this._dependsOn
// 	}
// 	public readonly subject = new Subject<
// 		StateCreation<any> | StateDisposal<any>
// 	>()
// 	// public tokens = new Map<string, ReadableToken<any>>()
// 	public constructor(
// 		store: Store,
// 		ctx: Molecule<any>[] | undefined,
// 		key: K,
// 		dependsOn: `all` | `any`,
// 	) {
// 		this.key = key
// 		this.stringKey = stringifyJson(key)
// 		this._dependsOn = dependsOn
// 		if (ctx) {
// 			for (const molecule of ctx) {
// 				store.moleculeGraph.set(
// 					{
// 						upstreamMoleculeKey: molecule.stringKey,
// 						downstreamMoleculeKey: this.stringKey,
// 					},
// 					{
// 						source: molecule.stringKey,
// 					},
// 				)
// 			}
// 		}
// 	}
// }

export type Molecule<K extends Canonical> = {
	readonly key: K
	readonly stringKey: stringified<K>
	readonly dependsOn: `all` | `any`
}
