import type { primitive } from "../primitive"

export type Serializable =
	| primitive
	| Readonly<{ [key: string]: Serializable }>
	| ReadonlyArray<Serializable>

export type Object<
	Key extends string = string,
	Value extends Serializable = Serializable,
> = Record<Key, Value>

export type Array<Element extends Serializable = Serializable> =
	ReadonlyArray<Element>
