export type primitive = boolean | number | string | null

export declare namespace Json {
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
}

export type stringified<J extends Json.Serializable> = J extends string
	? `"${J}"`
	: J extends number
		? `${J}`
		: J extends true
			? `true`
			: J extends false
				? `false`
				: J extends boolean
					? `false` | `true`
					: J extends null
						? `null`
						: string & { __json?: J }

export const parseJson = <S extends stringified<Json.Serializable>>(
	str: S | string,
): S extends stringified<infer J> ? J : Json.Serializable => JSON.parse(str)
