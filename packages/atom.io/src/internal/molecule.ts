import type {
	Above,
	Claim,
	CompoundFrom,
	CompoundTypedKey,
	Hierarchy,
	MoleculeCreationEvent,
	MoleculeDisposalEvent,
	MoleculeTransferEvent,
	SingularTypedKey,
	Vassal,
} from "atom.io"
import type { Canonical, stringified } from "atom.io/json"
import { parseJson, stringifyJson } from "atom.io/json"

import { disposeFromStore, findInStore } from "./families"
import { getFromStore } from "./get-state"
import { getTrace } from "./get-trace"
import { newest } from "./lineage"
import type { Store } from "./store"
import { IMPLICIT } from "./store"
import { isChildStore } from "./transaction"

export type Molecule<K extends Canonical> = {
	readonly key: K
	readonly stringKey: stringified<K>
	readonly dependsOn: `all` | `any`
}

export function makeRootMoleculeInStore<S extends string>(
	key: S,
	store: Store = IMPLICIT.STORE,
): S {
	const molecule = {
		key,
		stringKey: stringifyJson(key),
		dependsOn: `any`,
	} satisfies Molecule<S>
	store.molecules.set(stringifyJson(key), molecule)
	return key
}

export function allocateIntoStore<
	H extends Hierarchy,
	V extends Vassal<H>,
	A extends Above<V, H>,
>(
	store: Store,
	provenance: A,
	key: V,
	dependsOn: `all` | `any` = `any`,
): Claim<V> {
	const origin = provenance as Canonical | [Canonical, Canonical]
	const stringKey = stringifyJson(key)
	const invalidKeys: stringified<Canonical>[] = []
	const target = newest(store)

	if (Array.isArray(origin)) {
		for (const formerClaim of origin) {
			const claimString = stringifyJson(formerClaim)
			const claim = target.molecules.get(claimString)
			if (claim) {
				store.moleculeGraph.set(claimString, stringKey, { source: claimString })
			} else {
				invalidKeys.push(claimString)
			}
		}
	} else {
		const claimString = stringifyJson(origin)
		const claim = target.molecules.get(claimString)
		if (claim) {
			store.moleculeGraph.set(claimString, stringKey, { source: claimString })
		} else {
			invalidKeys.push(claimString)
		}
	}
	if (invalidKeys.length === 0) {
		target.molecules.set(stringKey, { key, stringKey, dependsOn })
	}

	const creationEvent: MoleculeCreationEvent = {
		type: `molecule_creation`,
		key,
		provenance: origin,
		timestamp: Date.now(),
	}
	const isTransaction =
		isChildStore(target) && target.transactionMeta.phase === `building`
	if (isTransaction) {
		target.transactionMeta.update.subEvents.push(creationEvent)
	} else {
		target.on.moleculeCreation.next(creationEvent)
	}

	for (const claim of invalidKeys) {
		const disposal = store.disposalTraces.buffer.find(
			(item) => item?.key === claim,
		)
		store.logger.error(
			`❌`,
			`key`,
			key,
			`allocation failed:`,
			`Could not allocate to ${claim} in store "${store.config.name}".`,
			disposal
				? `\n   ${claim} was most recently disposed\n${disposal.trace}`
				: `No previous disposal trace for ${claim} was found.`,
		)
	}

	return key as Claim<V>
}

export function fuseWithinStore<
	H extends Hierarchy,
	C extends CompoundFrom<H>,
	T extends C extends CompoundTypedKey<infer t, any, any> ? t : never,
	A extends C extends CompoundTypedKey<any, infer a, any> ? a : never,
	B extends C extends CompoundTypedKey<any, any, infer b> ? b : never,
>(
	store: Store,
	type: T,
	sideA: SingularTypedKey<A>,
	sideB: SingularTypedKey<B>,
): Claim<CompoundTypedKey<T, A, B>> {
	const compoundKey: CompoundTypedKey<T, A, B> =
		`T$--${type}==${sideA}++${sideB}`
	const above = [sideA, sideB] as Above<Vassal<H>, H>
	allocateIntoStore<H, Vassal<H>, Above<Vassal<H>, H>>(
		store,
		above,
		compoundKey as Vassal<H>,
		`all`,
	)
	return compoundKey
}

export function deallocateFromStore<H extends Hierarchy, V extends Vassal<H>>(
	store: Store,
	claim: Claim<V>,
): void {
	const stringKey = stringifyJson(claim)

	const molecule = store.molecules.get(stringKey)
	if (!molecule) {
		const disposal = store.disposalTraces.buffer.find(
			(item) => item?.key === stringKey,
		)
		store.logger.error(
			`❌`,
			`key`,
			claim,
			`deallocation failed:`,
			`Could not find allocation for ${stringKey} in store "${store.config.name}".`,
			disposal
				? `\n   This state was most recently deallocated\n${disposal.trace}`
				: `No previous disposal trace for ${stringKey} was found.`,
		)
		return
	}

	const joinKeys = store.moleculeJoins.getRelatedKeys(stringKey)
	if (joinKeys) {
		for (const joinKey of joinKeys) {
			const join = store.joins.get(joinKey)
			if (join) {
				join.relations.delete(claim)
			}
		}
	}
	store.moleculeJoins.delete(stringKey)

	const provenance: stringified<Canonical>[] = []

	const values: [string, any][] = []
	const disposalEvent: MoleculeDisposalEvent = {
		type: `molecule_disposal`,
		key: molecule.key,
		values,
		provenance,
		timestamp: Date.now(),
	}
	const target = newest(store)
	target.molecules.delete(stringKey)
	const isTransaction =
		isChildStore(target) && target.transactionMeta.phase === `building`
	if (isTransaction) {
		target.transactionMeta.update.subEvents.push(disposalEvent)
	}
	const relatedMolecules = store.moleculeGraph.getRelationEntries({
		downstreamMoleculeKey: stringKey,
	})
	if (relatedMolecules) {
		for (const [relatedStringKey, { source }] of relatedMolecules) {
			if (source === molecule.stringKey) {
				const relatedKey = parseJson(relatedStringKey)
				deallocateFromStore<any, any>(store, relatedKey)
			} else {
				provenance.push(source)
			}
		}
	}
	const familyKeys = target.moleculeData.getRelatedKeys(molecule.stringKey)
	if (familyKeys) {
		for (const familyKey of familyKeys) {
			// biome-ignore lint/style/noNonNullAssertion: tokens of molecules must have a family
			const family = target.families.get(familyKey)!
			const value = getFromStore(store, family, claim)
			values.push([family.key, value])
			disposeFromStore(store, family, claim)
		}
	}

	target.moleculeGraph.delete(molecule.stringKey)
	target.moleculeJoins.delete(molecule.stringKey)
	target.moleculeData.delete(molecule.stringKey)

	if (!isTransaction) {
		target.on.moleculeDisposal.next(disposalEvent)
	}
	target.molecules.delete(molecule.stringKey)

	const trace = getTrace(new Error())
	store.disposalTraces.add({ key: stringKey, trace })
}
export function claimWithinStore<
	H extends Hierarchy,
	V extends Exclude<Vassal<H>, CompoundTypedKey>,
	A extends Above<V, H>,
>(
	store: Store,
	newProvenance: A,
	claim: Claim<V>,
	exclusive?: `exclusive`,
): Claim<V> {
	const stringKey = stringifyJson(claim)
	const target = newest(store)
	const molecule = target.molecules.get(stringKey)
	if (!molecule) {
		const disposal = store.disposalTraces.buffer.find(
			(item) => item?.key === stringKey,
		)
		store.logger.error(
			`❌`,
			`key`,
			stringKey,
			`claim failed:`,
			`Could not allocate to ${stringKey} in store "${store.config.name}".`,
			disposal
				? `\n   ${stringKey} was most recently disposed\n${disposal.trace}`
				: `No previous disposal trace for ${stringKey} was found.`,
		)
		return claim
	}

	const newProvenanceKey = stringifyJson(newProvenance as Canonical)
	const newProvenanceMolecule = target.molecules.get(newProvenanceKey)
	if (!newProvenanceMolecule) {
		const disposal = store.disposalTraces.buffer.find(
			(item) => item?.key === newProvenanceKey,
		)
		store.logger.error(
			`❌`,
			`key`,
			claim,
			`claim failed:`,
			`Could not allocate to ${newProvenanceKey} in store "${store.config.name}".`,
			disposal
				? `\n   ${newProvenanceKey} was most recently disposed\n${disposal.trace}`
				: `No previous disposal trace for ${newProvenanceKey} was found.`,
		)
		return claim
	}

	const priorProvenance = store.moleculeGraph
		.getRelationEntries({
			downstreamMoleculeKey: molecule.stringKey,
		})
		.filter(([, { source }]) => source !== stringKey)
		.map(([key]) => parseJson(key))
	if (exclusive) {
		target.moleculeGraph.delete(stringKey)
	}
	target.moleculeGraph.set(
		{
			upstreamMoleculeKey: newProvenanceMolecule.stringKey,
			downstreamMoleculeKey: molecule.stringKey,
		},
		{
			source: newProvenanceMolecule.stringKey,
		},
	)
	const transferEvent: MoleculeTransferEvent = {
		type: `molecule_transfer`,
		key: molecule.key,
		exclusive: Boolean(exclusive),
		from: priorProvenance,
		to: [newProvenanceMolecule.key],
		timestamp: Date.now(),
	}
	const isTransaction =
		isChildStore(target) && target.transactionMeta.phase === `building`
	if (isTransaction) {
		target.transactionMeta.update.subEvents.push(transferEvent)
	}

	return claim
}
