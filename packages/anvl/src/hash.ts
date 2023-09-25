import { pipe } from "anvl/function"
import { map, reduce } from "./array"
import { split } from "./string"

// imperative
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
// functional
export const hash = (str: string): number =>
	str === ``
		? 0
		: pipe(
				str,
				split(``),
				map((char) => char.charCodeAt(0)),
				reduce((acc, char) => (acc << 5) - acc + char, 0),
				(hash) => hash & hash,
		  )

// a possible flaw in an object hash function is not commutative for properties
// { a: 1, b: 2 } and { b: 2, a: 1 } will have different hashes
// this means it is important to sort the keys of the object before hashing
