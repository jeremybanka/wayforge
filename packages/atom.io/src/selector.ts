import type { Store, Subject } from "atom.io/internal"
import {
	IMPLICIT,
	createSelectorFamily,
	createStandaloneSelector,
} from "atom.io/internal"
import type { Json } from "atom.io/json"

import type { ReadonlySelectorToken, WritableSelectorToken } from "."
import type { Read, Write } from "./transaction"

export type WritableSelectorOptions<T> = {
	key: string
	get: Read<() => T>
	set: Write<(newValue: T) => void>
}
export type ReadonlySelectorOptions<T> = {
	key: string
	get: Read<() => T>
}

export function selector<T>(
	options: WritableSelectorOptions<T>,
): WritableSelectorToken<T>
export function selector<T>(
	options: ReadonlySelectorOptions<T>,
): ReadonlySelectorToken<T>
export function selector<T>(
	options: ReadonlySelectorOptions<T> | WritableSelectorOptions<T>,
): ReadonlySelectorToken<T> | WritableSelectorToken<T> {
	return createStandaloneSelector(options, IMPLICIT.STORE)
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
> = ((key: K) => WritableSelectorToken<T>) & {
	key: string
	type: `selector_family`
	subject: Subject<WritableSelectorToken<T>>
	install: (store: Store) => void
	__T?: T
	__K?: K
}
export type SelectorFamilyToken<T, K extends Json.Serializable> = {
	key: string
	type: `selector_family`
	__T?: T
	__K?: K
}

export type ReadonlySelectorFamily<
	T,
	K extends Json.Serializable = Json.Serializable,
> = ((key: K) => ReadonlySelectorToken<T>) & {
	key: string
	type: `readonly_selector_family`
	subject: Subject<ReadonlySelectorToken<T>>
	install: (store: Store) => void
	__T?: T
	__K?: K
}
export type ReadonlySelectorFamilyToken<T, K extends Json.Serializable> = {
	key: string
	type: `readonly_selector_family`
	__T?: T
	__K?: K
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
