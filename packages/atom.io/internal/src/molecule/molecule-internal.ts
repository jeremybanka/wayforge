import type {
	MoleculeKey,
	MoleculeConstructor,
	MoleculeFamilyToken,
	MoleculeToken,
	ReadableToken,
	StateCreation,
	StateDisposal,
} from "atom.io"
import type { Join } from "atom.io/data"
import { stringifyJson } from "atom.io/json"

import { Subject } from "../subject"

export class Molecule<M extends MoleculeConstructor>
	implements MoleculeToken<M>
{
	public readonly type = `molecule`
	public stringKey: string
	public family?: MoleculeFamilyToken<M>
	public readonly subject = new Subject<
		StateCreation<any> | StateDisposal<any>
	>()
	public tokens = new Map<string, ReadableToken<any>>()
	public above = new Map<string, Molecule<any>>()
	public below = new Map<string, Molecule<any>>()
	public joins = new Map<string, Join<any, any, any, any>>()
	public instance: InstanceType<M>
	public constructor(
		ctx: Molecule<any> | Molecule<any>[] | undefined,
		public readonly key: MoleculeKey<M>,
		family?: MoleculeFamilyToken<M>,
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
