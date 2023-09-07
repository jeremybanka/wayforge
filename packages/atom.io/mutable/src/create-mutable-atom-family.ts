import * as AtomIO from "atom.io"
import type { Subject } from "atom.io/internal"
import type { Json, JsonInterface } from "atom.io/json"
import { selectJsonFamily } from "atom.io/json"
import type { Transceiver } from "atom.io/tracker"
import { trackerFamily } from "atom.io/tracker"

import type { MutableAtomToken } from "./create-mutable-atom"

// biome-ignore format: intersection
export type MutableAtomFamilyOptions<
	Core extends Transceiver<Json.Serializable>,
	SerializableCore extends Json.Serializable,
	Key extends string,
> = JsonInterface<Core, SerializableCore> &
	Omit<AtomIO.AtomFamilyOptions<Core, Key>, `key`> & { key: `${Key}::mutable` }

// biome-ignore format: intersection
export type MutableAtomFamily<
	Core extends Transceiver<Json.Serializable>,
	SerializableCore extends Json.Serializable,
	Key extends Json.Serializable,
> = ((key: Key) => MutableAtomToken<Core, SerializableCore>) & {
	key: `${string}::mutable`
	type: `atom_family`
	subject: Subject<MutableAtomToken<Core, SerializableCore>>
}

export function createMutableAtomFamily<
	Core extends Transceiver<Json.Serializable>,
	SerializableCore extends Json.Serializable,
	Key extends string,
>(
	options: MutableAtomFamilyOptions<Core, SerializableCore, Key>,
): MutableAtomFamily<Core, SerializableCore, Key> {
	const coreFamily = AtomIO.atomFamily<Core, Key>(options)
	selectJsonFamily(coreFamily, options)
	trackerFamily(coreFamily)
	return coreFamily as MutableAtomFamily<Core, SerializableCore, Key>
}
