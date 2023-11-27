import type { Subject } from "atom.io/internal"
import { IMPLICIT, createSelector, createSelectorFamily } from "atom.io/internal"
import type { Json } from "atom.io/json"

import type { ReadonlySelectorToken, SelectorToken } from "."
import type { Read, Write } from "./transaction"

export type SelectorOptions<T> = {
	key: string
	get: Read<() => T>
	set: Write<(newValue: T) => void>
}
export type ReadonlySelectorOptions<T> = {
	key: string
	get: Read<() => T>
}

export function selector<T>(options: SelectorOptions<T>): SelectorToken<T>
export function selector<T>(
	options: ReadonlySelectorOptions<T>,
): ReadonlySelectorToken<T>
export function selector<T>(
	options: ReadonlySelectorOptions<T> | SelectorOptions<T>,
): ReadonlySelectorToken<T> | SelectorToken<T> {
	return createSelector(options, undefined, IMPLICIT.STORE)
}

export type SelectorFamilyOptions<T, K extends Json.Serializable> = {
	key: string
	get: (key: K) => Read<() => T>
	set: (key: K) => Write<(newValue: T) => void>
}
export type ReadonlySelectorFamilyOptions<T, K extends Json.Serializable> = {
	key: string
	get: (key: K) => Read<() => T>
}

export type SelectorFamily<
	T,
	K extends Json.Serializable = Json.Serializable,
> = ((key: K) => SelectorToken<T>) & {
	key: string
	type: `selector_family`
	subject: Subject<SelectorToken<T>>
}

export type ReadonlySelectorFamily<
	T,
	K extends Json.Serializable = Json.Serializable,
> = ((key: K) => ReadonlySelectorToken<T>) & {
	key: string
	type: `readonly_selector_family`
	subject: Subject<ReadonlySelectorToken<T>>
}

export function selectorFamily<T, K extends Json.Serializable>(
	options: SelectorFamilyOptions<T, K>,
): SelectorFamily<T, K>
export function selectorFamily<T, K extends Json.Serializable>(
	options: ReadonlySelectorFamilyOptions<T, K>,
): ReadonlySelectorFamily<T, K>
export function selectorFamily<T, K extends Json.Serializable>(
	options: ReadonlySelectorFamilyOptions<T, K> | SelectorFamilyOptions<T, K>,
): ReadonlySelectorFamily<T, K> | SelectorFamily<T, K> {
	return createSelectorFamily(options, IMPLICIT.STORE)
}
