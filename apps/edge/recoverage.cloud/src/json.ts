export namespace Json {
	export type primitive = boolean | number | string | null
	export type Arr = Array<Arr | Obj | primitive>
	export type Obj = { [key: keyof any]: Arr | Obj | primitive }
	export type Val = Arr | Obj | primitive
	export type Compatible<J> = { toJSON(): J }
	export type stringified<J extends Compatible<any> | Val> = string & {
		json?: J extends Compatible<infer C> ? C : J
	}
}

export function stringify<C extends Json.Compatible<any>>(
	value: C,
): Json.stringified<C>
export function stringify<J extends Json.Val>(value: J): Json.stringified<J>
export function stringify(
	value: Json.Compatible<any> | Json.Val,
): Json.stringified<Json.Val> {
	return JSON.stringify(value)
}

export function parse<J extends Json.Val>(stringified: Json.stringified<J>): J {
	return JSON.parse(stringified)
}
