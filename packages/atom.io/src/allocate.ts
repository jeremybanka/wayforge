import type { Each, Store } from "atom.io/internal"
import {
	disposeFromStore,
	isChildStore,
	Molecule,
	newest,
} from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import { makeRootMoleculeInStore } from "./molecule"
import type {
	MoleculeCreationModern,
	MoleculeDisposalModern,
} from "./transaction"

export const $provenance = Symbol(`provenance`)
export type Claim<
	H extends Hierarchy,
	V extends Vassal<H>,
	A extends Above<V, H>,
> = V & {
	[$provenance]?: A
}

export function allocateIntoStore<
	H extends Hierarchy,
	V extends Vassal<H>,
	A extends Above<V, H>,
>(store: Store, provenance: A, key: V): Claim<H, V, A> {
	const stringKey = stringifyJson(key)
	try {
		const above: Molecule<any>[] = []

		let allocationAttachmentStyle: `all` | `any`
		if (provenance === `root`) {
			// biome-ignore lint/style/noNonNullAssertion: let's assume we made the root molecule to get here
			above.push(store.molecules.get(`"root"`)!)
			allocationAttachmentStyle = `all`
		} else if (typeof provenance === `string` && provenance.startsWith(T$)) {
			allocationAttachmentStyle = `any`
			const provenanceKey = stringifyJson(provenance as Canonical)
			const provenanceMolecule = store.molecules.get(provenanceKey)
			if (!provenanceMolecule) {
				throw new Error(
					`Molecule ${provenanceKey} not found in store "${store.config.name}"`,
				)
			}
			above.push(provenanceMolecule)
		} else {
			const allocationIsCompound = key.startsWith(`T$--`)
			if (allocationIsCompound) {
				allocationAttachmentStyle = `all`
				for (const claim of provenance as Original[]) {
					const provenanceKey = stringifyJson(claim)
					const provenanceMolecule = store.molecules.get(provenanceKey)
					if (!provenanceMolecule) {
						throw new Error(
							`Molecule ${provenanceKey} not found in store "${store.config.name}"`,
						)
					}
					above.push(provenanceMolecule)
				}
			} else {
				allocationAttachmentStyle = `any`
				const provenanceKey = stringifyJson(provenance as Canonical)
				const provenanceMolecule = store.molecules.get(provenanceKey)
				if (!provenanceMolecule) {
					throw new Error(
						`Molecule ${provenanceKey} not found in store "${store.config.name}"`,
					)
				}
				above.push(provenanceMolecule)
			}
		}

		const molecule = new Molecule(above, key)
		molecule._dependsOn = allocationAttachmentStyle

		store.molecules.set(stringKey, molecule)

		for (const aboveMolecule of above) {
			aboveMolecule.below.set(molecule.stringKey, molecule)
		}

		const creationEvent: MoleculeCreationModern = {
			type: `molecule_creation`,
			subType: `modern`,
			key: molecule.key,
			provenance: provenance as Canonical,
		}
		const target = newest(store)
		const isTransaction =
			isChildStore(target) && target.transactionMeta.phase === `building`
		if (isTransaction) {
			target.transactionMeta.update.updates.push(creationEvent)
		} else {
			target.on.moleculeCreationStart.next(creationEvent)
		}
	} catch (thrown) {
		if (thrown instanceof Error) {
			store.logger.error(
				`❌`,
				`molecule`,
				stringKey,
				`allocation failed:`,
				thrown.message,
			)
		}
	}

	return key as Claim<H, V, A>
}

export function deallocateFromStore<
	H extends Hierarchy,
	V extends Vassal<H>,
	A extends Above<V, H>,
>(store: Store, claim: Claim<H, V, A>): void {
	const stringKey = stringifyJson(claim)
	const molecule = store.molecules.get(stringKey)
	if (!molecule) {
		throw new Error(
			`Molecule ${stringKey} not found in store "${store.config.name}"`,
		)
	}

	for (const join of molecule.joins.values()) {
		join.relations.delete(molecule.key)
		join.molecules.delete(molecule.stringKey)
	}

	let provenance: Canonical
	if (molecule.above.size === 1) {
		const above = molecule.above.values().next().value
		provenance = above.key
	} else {
		provenance = [...molecule.above.values()].map(({ key }) => key)
	}
	const values: [string, any][] = []
	for (const stateToken of molecule.tokens.values()) {
		// biome-ignore lint/style/noNonNullAssertion: tokens of molecules must have a family
		const tokenFamily = stateToken.family!
		values.push([tokenFamily.key, store.valueMap.get(stateToken.key)])
	}

	for (const state of molecule.tokens.values()) {
		disposeFromStore(store, state)
	}
	for (const child of molecule.below.values()) {
		if (child.dependsOn === `all`) {
			deallocateFromStore<any, any, any>(store, child.key)
		} else {
			child.above.delete(molecule.stringKey)
			if (child.above.size === 0) {
				deallocateFromStore<any, any, any>(store, child.key)
			}
		}
	}
	molecule.below.clear()

	const disposalEvent: MoleculeDisposalModern = {
		type: `molecule_disposal`,
		subType: `modern`,
		key: molecule.key,
		values,
		provenance,
	}
	const target = newest(store)
	const isTransaction =
		isChildStore(target) && target.transactionMeta.phase === `building`
	if (isTransaction) {
		target.transactionMeta.update.updates.push(disposalEvent)
	} else {
		target.on.moleculeDisposal.next(disposalEvent)
	}
	target.molecules.delete(molecule.stringKey)

	for (const parent of molecule.above.values()) {
		parent.below.delete(molecule.stringKey)
	}
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function realm<H extends Hierarchy>(store: Store) {
	const root = makeRootMoleculeInStore(`root`, store)
	return {
		root,
		allocate: <V extends Vassal<H>, A extends Above<V, H>>(
			provenance: A,
			key: V,
		): Claim<H, V, A> => {
			return allocateIntoStore(store, provenance, key)
		},
		deallocate: <V extends Vassal<H>, A extends Above<V, H>>(
			claim: Claim<H, V, A>,
		): void => {
			deallocateFromStore(store, claim)
		},
	}
}

export const T$ = `T$`
export type T$ = typeof T$
export type Tag<T extends string = string> = `T$--${T}`
export type Original<
	TypeTag extends string = string,
	Unique extends string = string,
> = `${TypeTag}::${Unique}`
export type Compound<
	TypeTag extends Tag<string> = Tag<string>,
	UniqueX extends string = string,
	UniqueY extends string = string,
> = `${TypeTag}==${UniqueX}++${UniqueY}`
export type AnyTypedKey = Compound | Original
type Scope = Original[]
type MutualFealty = {
	above: Scope
	below: Compound
	style: `all` | `any`
}
type ExclusiveFealty = {
	above: AnyTypedKey | `root`
	below: Scope
}
type Fealty = ExclusiveFealty | MutualFealty

export type Hierarchy<F extends Fealty[] = Fealty[]> = Each<F>

export type Vassal<H extends Hierarchy> = {
	[K in keyof H]: H[K] extends MutualFealty
		? H[K][`below`]
		: H[K] extends { below: Array<infer V> }
			? V extends AnyTypedKey
				? V
				: never
			: never
}[keyof H]

export type Above<TK extends AnyTypedKey, H extends Hierarchy> = {
	[K in keyof H]: H[K] extends MutualFealty
		? TK extends H[K][`below`]
			? H[K][`above`]
			: never
		: H[K] extends { below: Array<infer V> }
			? TK extends V
				? H[K] extends ExclusiveFealty
					? H[K][`above`]
					: never
				: never
			: never
}[keyof H]

export type Below<
	TK extends AnyTypedKey | AnyTypedKey[],
	H extends Hierarchy,
> = {
	[K in keyof H]: H[K] extends MutualFealty
		? TK extends H[K][`above`]
			? H[K][`below`]
			: TK extends H[K][`above`][number]
				? H[K][`below`]
				: never
		: H[K] extends { above: infer V }
			? TK extends V
				? H[K] extends ExclusiveFealty
					? H[K][`below`][number]
					: never
				: never
			: never
}[keyof H]

export type Mutuals<
	TK extends AnyTypedKey | AnyTypedKey[],
	H extends Hierarchy,
> = {
	[K in keyof H]: H[K] extends MutualFealty
		? TK extends H[K][`above`][number]
			? [mutual: Exclude<H[K][`above`][number], TK>, below: H[K][`below`]]
			: never
		: never
}[keyof H]

export function decomposeCompoundKey<K extends Compound>(
	key: K,
): K extends Compound<infer A, infer B, infer C> ? [A, B, C] : never {
	const [typeTag, ...contents] = key.split(`==`)
	let content = contents[0]
	if (contents.length > 1) {
		content += `==` + contents.slice(1).join(`==`)
	}
	const constituents = content.split(`++`)
	let [singularB, singularC] = constituents
	if (constituents.length !== 2) {
		singularB = ``
		singularC = ``
		let i = 0
		let m = 0
		while (constituents.length) {
			const constituent = constituents.shift() as string
			if (i === 0 && !constituent?.startsWith(`T$--`)) {
				singularB = constituent
				singularC = constituents.join(`++`)
				break
			}
			if (constituent.startsWith(`T$--`)) {
				m++
				singularB += constituent
			} else {
				m--
				singularB += `++` + constituent
			}
			if (m === 0) {
				singularC = constituents.join(`++`)
				break
			}
			i++
		}
	}
	return [typeTag, singularB, singularC] as any
}
