import * as AtomIO from "atom.io"
import type { Json, JsonInterface } from "atom.io/json"
import { selectJson } from "atom.io/json"
import { tracker } from "atom.io/tracker"
import type { Transceiver } from "atom.io/tracker"

export interface MutableAtomToken<
	Core extends Transceiver<Json.Serializable>,
	SerializableCore extends Json.Serializable,
> extends AtomIO.AtomToken<Core> {
	key: `${string}::mutable`
	__core?: SerializableCore
	__update?: Core extends Transceiver<infer Update> ? Update : never
}

export function isAtomTokenMutable(
	token: AtomIO.AtomToken<any>,
): token is MutableAtomToken<any, any> {
	return token.key.endsWith(`::mutable`)
}

// rome-ignore format: complex intersection
export type MutableAtomOptions<
	Core extends Transceiver<Json.Serializable>,
	SerializableCore extends Json.Serializable,
> = 
	&	JsonInterface<Core, SerializableCore> 
	& Omit<AtomIO.AtomOptions<Core>, `key`>
	& { key: `${string}::mutable` }

export function mutableAtom<
	Core extends Transceiver<Json.Serializable>,
	SerializableCore extends Json.Serializable,
>(
	options: MutableAtomOptions<Core, SerializableCore>,
): MutableAtomToken<Core, SerializableCore> {
	const coreState = AtomIO.atom<Core>(options)
	tracker(coreState)
	selectJson(coreState, options)
	return coreState as MutableAtomToken<Core, SerializableCore>
}

export const getJsonToken = <
	Core extends Transceiver<Json.Serializable>,
	SerializableCore extends Json.Serializable,
>(
	mutableAtomToken: MutableAtomToken<Core, SerializableCore>,
): AtomIO.SelectorToken<SerializableCore> => {
	return {
		...mutableAtomToken,
		key: `${mutableAtomToken.key}:JSON`,
		type: `selector`,
	} as unknown as AtomIO.SelectorToken<SerializableCore>
}

export const getTrackerToken = <
	Core extends Transceiver<Json.Serializable>,
	SerializableCore extends Json.Serializable,
>(
	mutableAtomToken: MutableAtomToken<Core, SerializableCore>,
): AtomIO.AtomToken<Core extends Transceiver<infer Update> ? Update : never> => {
	return {
		...mutableAtomToken,
		key: `${mutableAtomToken.key}:tracker`,
		type: `atom`,
	} as unknown as AtomIO.AtomToken<
		Core extends Transceiver<infer Update> ? Update : never
	>
}
