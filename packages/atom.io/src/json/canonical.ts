import type { primitive } from "./json"

/** Only Canonical values should be used for keys because they always serialize to the same string */
export type Canonical = primitive | ReadonlyArray<Canonical>

export type packed<C extends Canonical> = string & { __canonical?: C }

const BOOL = `\u0001`
const NULL = `\u0002`
const STRING = `\u0003`
const NUMBER = `\u0004`
export const packCanonical = <C extends Canonical>(
	value: Canonical,
): packed<C> => {
	if (value === null) return NULL
	// eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
	switch (typeof value) {
		case `string`:
			return STRING + value
		case `number`:
			return NUMBER + value
		case `boolean`:
			return BOOL + +value
		case `object`: // array
			return JSON.stringify(value)
	}
}
export const unpackCanonical = <C extends Canonical>(value: packed<C>): C => {
	const type = value[0] as `[` | `\u0001` | `\u0002` | `\u0003` | `\u0004`
	switch (type) {
		case STRING:
			return value.slice(1) as C
		case NUMBER:
			return +value.slice(1) as C
		case BOOL:
			return (value.slice(1) === `1`) as C
		case NULL:
			return null as C
		case `[`:
			return JSON.parse(value)
	}
}
