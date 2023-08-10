// Type definitions for hamt_plus 1.0.2
// Project: https://github.com/mattbierner/hamt_plus
// Definitions by: Jeremy Banka <https://github.com/jeremybanka>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

// eslint-disable-next-line quotes
declare module "hamt_plus" {
	export type HashFunction = (x: string) => number
	export type KeyComparator<K> = (x: K, y: K) => boolean

	export interface HamtConfig<K> {
		hash?: HashFunction
		keyEq?: KeyComparator<K>
	}

	export interface Hamt<T = unknown, K = string>
		extends IterableIterator<[string, T]> {
		_config: {
			hash: (x: string) => number
			keyEq: KeyComparator<K>
		}
		_edit: (x: any) => any
		_editable: boolean
		_root: {
			_modify: (
				x: number,
				compare: KeyComparator<K>,
				z: number,
				f: HashFunction,
				hash: number,
				size: number,
			) => number
		}
		_size: number
		size: number

		setTree: (newRoot: any, sizeValue: number) => Hamt<T, K>

		set: (key: K, value: T) => Hamt<T, K>
		setHash: <T>(hash: number, key: K, value: T) => Hamt<T, K>
		remove: (key: K) => Hamt<T, K>
		delete: (key: K) => Hamt<T, K>
		removeHash: (hash: number, key: K) => Hamt<T, K>
		deleteHash: (hash: number, key: K) => Hamt<T, K>

		tryGet: (alt: T, key: K) => T | undefined
		tryGetHash: (alt: T, hash: number, key: K) => T | undefined
		get: (key: K, alt?: T) => typeof alt extends undefined ? T | undefined : T
		getHash: (hash: number, key: K) => T | undefined

		has: (key: K) => boolean
		hasHash: (hash: number, key: K) => boolean

		isEmpty: () => boolean

		modify: (key: K, f: (value: T) => T) => Hamt<T, K>
		modifyHash: (hash: number, key: K, f: (value: T) => T) => Hamt<T, K>

		mutate: (key: K, f: (map: Hamt<T, K>) => void) => Hamt<T, K>
		beginMutation: () => Hamt<T, K>
		endMutation: () => Hamt<T, K>

		count: () => number
		values: () => T[]
		keys: () => K[]
		entries: () => Iterable<[key: K, value: T]>
		fold: <Acc>(
			callbackfn: (previousValue: Acc, currentValue: T, key: K) => Acc,
			initialValue: Acc,
		) => Acc
		forEach: (callbackfn: (value: T, key: K, map: Hamt<T, K>) => void) => void
	}

	const lib: {
		empty: Hamt
		// this satisfies the exception mentioned in the readme for this rule.
		// tslint:disable-next-line:no-unnecessary-generics
		make: <T = unknown, K = string>(config?: HamtConfig<K>) => Hamt<T, K>

		hash: HashFunction

		set: <T, K>(key: K, value: T, map: Hamt<T, K>) => Hamt<T, K>
		setHash: <T, K>(
			hash: number,
			key: K,
			value: T,
			map: Hamt<T, K>,
		) => Hamt<T, K>
		remove: <T, K>(key: K, map: Hamt<T, K>) => Hamt<T, K>
		removeHash: <T, K>(hash: number, key: K, map: Hamt<T, K>) => Hamt<T, K>

		tryGet: <T, K>(alt: T, key: K, map: Hamt<T, K>) => T
		tryGetHash: <T, K>(alt: T, hash: number, key: K, map: Hamt<T, K>) => T
		get: <T, K>(key: K, map: Hamt<T, K>) => T
		getHash: <T, K>(hash: number, key: K, map: Hamt<T, K>) => T

		has: <K>(key: K, map: Hamt<any, K>) => boolean
		hasHash: <K>(hash: number, key: K, map: Hamt<any, K>) => boolean

		isEmpty: (map: Hamt) => boolean

		modifyHash: <T, K>(
			f: (value: T) => T,
			hash: number,
			key: K,
			map: Hamt<T, K>,
		) => Hamt<T, K>
		modify: <T, K>(f: (value: T) => T, key: K, map: Hamt<T, K>) => Hamt<T, K>

		mutate: <T, K>(f: (map: Hamt<T, K>) => void, map: Hamt<T, K>) => Hamt<T, K>
		beginMutation: <T, K>(map: Hamt<T, K>) => Hamt<T, K>
		endMutation: <T, K>(map: Hamt<T, K>) => Hamt<T, K>

		count: (map: Hamt) => number
		values: <T>(map: Hamt<T>) => T[]
		keys: <K>(map: Hamt<any, K>) => K[]
		entries: <T, K>(map: Hamt<T, K>) => Iterator<[key: K, value: T]>
		fold: <T, K, Acc>(
			callbackfn: (previousValue: Acc, currentValue: T, key: K) => Acc,
			initialValue: Acc,
			map: Hamt<T, K>,
		) => Acc
		forEach: <T, K>(
			callbackfn: (value: T, key: K, map: Hamt<T, K>) => void,
			map: Hamt<T, K>,
		) => void
	}
	export default lib
}
