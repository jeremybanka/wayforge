import * as ARNE from "fp-ts/ReadonlyNonEmptyArray"
import { pipe } from "fp-ts/function"
import * as S from "fp-ts/string"

// function to hash a string
export const hashString = (str: string): number => {
	let hash = 0
	if (str.length === 0) return hash
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i)
		hash = (hash << 5) - hash + char
		hash = hash & hash // Convert to 32bit integer
	}
	return hash
}
// using fp-ts
export const hash = (str: string): number =>
	pipe(
		str,
		S.split(``),
		ARNE.map((char) => char.charCodeAt(0)),
		ARNE.reduce(0, (acc, char) => (acc << 5) - acc + char),
		(hash) => hash & hash,
	)

// a possible flaw in an object hash function is not commutative for properties
// { a: 1, b: 2 } and { b: 2, a: 1 } will have different hashes
// this means it is important to sort the keys of the object before hashing
