type primitive = boolean | number | string | null

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
