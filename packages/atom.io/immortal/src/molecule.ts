import type { ReadableToken, StateCreation, StateDisposal } from "atom.io"
import type { Join } from "atom.io/data"
import { Subject } from "atom.io/internal"
import { type Json, stringifyJson } from "atom.io/json"

import type {
	MoleculeConstructor,
	MoleculeFamilyToken,
	MoleculeToken,
} from "./make-molecule"

export class Molecule<
	K extends Json.Serializable,
	C extends MoleculeConstructor<K>,
> implements MoleculeToken<K, C>
{
	public readonly type = `molecule`
	public stringKey: string
	public family?: MoleculeFamilyToken<K, C>
	public readonly subject = new Subject<
		StateCreation<any> | StateDisposal<any>
	>()
	public tokens = new Map<string, ReadableToken<any>>()
	public above = new Map<string, Molecule<any, any>>()
	public below = new Map<string, Molecule<any, any>>()
	public joins = new Map<string, Join<any, any, any, any>>()
	public instance: InstanceType<C>
	public constructor(
		ctx: Molecule<K, C> | Molecule<K, C>[] | undefined,
		public readonly key: K,
		family?: MoleculeFamilyToken<K, C>,
	) {
		this.stringKey = stringifyJson(key)
		if (family) {
			this.family = family
		}
		if (ctx) {
			if (Array.isArray(ctx)) {
				for (const molecule of ctx) {
					this.above.set(molecule.stringKey, molecule)
				}
			} else {
				this.above.set(ctx.stringKey, ctx)
			}
		}
	}
}
