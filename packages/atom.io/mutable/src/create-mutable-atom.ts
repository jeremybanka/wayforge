import * as AtomIO from "atom.io"
import type { Json, JsonInterface } from "atom.io/json"
import { selectJson } from "atom.io/json"
import { tracker } from "atom.io/tracker"
import type { Transceiver } from "atom.io/tracker"
import { createAtom } from "../../internal/src"

export interface MutableAtomToken<
	Core extends Transceiver<Json.Serializable>,
	SerializableCore extends Json.Serializable,
> extends AtomIO.AtomToken<Core> {
	key: `${string}::mutable`
	__core?: SerializableCore
	__update?: Core extends Transceiver<infer Update> ? Update : never
}

// rome-ignore format: complex intersection
export type MutableAtomOptions<
	Core extends Transceiver<Json.Serializable>,
	SerializableCore extends Json.Serializable,
> = 
	&	JsonInterface<Core, SerializableCore> 
	& Omit<AtomIO.AtomOptions<Core>, `key`>
	& { key: `${string}::mutable` }

export function createMutableAtom<
	Core extends Transceiver<Json.Serializable>,
	SerializableCore extends Json.Serializable,
>(
	options: MutableAtomOptions<Core, SerializableCore>,
	store?: AtomIO.Store,
): MutableAtomToken<Core, SerializableCore> {
	const coreState = createAtom<Core>(options)
	tracker(coreState, store)
	selectJson(coreState, options, store)
	return coreState as MutableAtomToken<Core, SerializableCore>
}

export const getJsonToken = <
	Core extends Transceiver<Json.Serializable>,
	SerializableCore extends Json.Serializable,
>(
	mutableAtomToken: MutableAtomToken<Core, SerializableCore>,
): AtomIO.SelectorToken<SerializableCore> => {
	const key = mutableAtomToken.family
		? `${mutableAtomToken.family.key}:JSON(${mutableAtomToken.family.subKey})`
		: `${mutableAtomToken.key}:JSON`
	return {
		...mutableAtomToken,
		key,
		type: `selector`,
	} as unknown as AtomIO.SelectorToken<SerializableCore>
}

export const getTrackerToken = <
	Core extends Transceiver<Json.Serializable>,
	SerializableCore extends Json.Serializable,
>(
	mutableAtomToken: MutableAtomToken<Core, SerializableCore>,
): AtomIO.AtomToken<Core extends Transceiver<infer Update> ? Update : never> => {
	const key = mutableAtomToken.family
		? `${mutableAtomToken.family.key}:tracker(${mutableAtomToken.family.subKey})`
		: `${mutableAtomToken.key}:tracker`
	return {
		...mutableAtomToken,
		key,
		type: `atom`,
	} as unknown as AtomIO.AtomToken<
		Core extends Transceiver<infer Update> ? Update : never
	>
}
