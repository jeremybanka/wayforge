import type { Serializable } from "~/packages/anvl/src/json"
import { stringifyJson } from "~/packages/anvl/src/json"

import type { Store } from "."
import {
	Subject,
	atom__INTERNAL,
	withdraw,
	selector__INTERNAL,
	target,
	deposit,
	IMPLICIT,
} from "."
import type {
	AtomFamily,
	AtomFamilyOptions,
	AtomToken,
	FamilyMetadata,
	ReadonlySelectorFamily,
	ReadonlySelectorFamilyOptions,
	ReadonlySelectorToken,
	SelectorFamily,
	SelectorFamilyOptions,
	SelectorToken,
} from ".."

export function atomFamily__INTERNAL<T, K extends Serializable>(
	options: AtomFamilyOptions<T, K>,
	store: Store = IMPLICIT.STORE,
): AtomFamily<T, K> {
	const subject = new Subject<AtomToken<T>>()
	return Object.assign(
		(key: K): AtomToken<T> => {
			const subKey = stringifyJson(key)
			const family: FamilyMetadata = { key: options.key, subKey }
			const fullKey = `${options.key}(${subKey})`
			const existing = withdraw({ key: fullKey, type: `atom` }, store)
			const token: AtomToken<any> = existing
				? deposit(existing)
				: atom__INTERNAL<T>(
						{
							key: fullKey,
							default:
								options.default instanceof Function
									? options.default(key)
									: options.default,
							effects: options.effects?.(key),
						},
						family,
						store,
				  )
			subject.next(token)
			return token
		},
		{
			key: options.key,
			type: `atom_family`,
			subject,
		} as const,
	)
}

export function readonlySelectorFamily__INTERNAL<T, K extends Serializable>(
	options: ReadonlySelectorFamilyOptions<T, K>,
	store?: Store,
): ReadonlySelectorFamily<T, K> {
	const core = target(store)
	const subject = new Subject<ReadonlySelectorToken<T>>()
	return Object.assign(
		(key: K): ReadonlySelectorToken<T> => {
			const subKey = stringifyJson(key)
			const family: FamilyMetadata = { key: options.key, subKey }
			const fullKey = `${options.key}(${subKey})`
			const existing = core.readonlySelectors.get(fullKey)
			if (existing) {
				return deposit(existing)
			}
			return selector__INTERNAL<T>(
				{
					key: fullKey,
					get: options.get(key),
				},
				family,
				store,
			) as ReadonlySelectorToken<T>
		},
		{
			key: options.key,
			type: `readonly_selector_family`,
			subject,
		} as const,
	) as ReadonlySelectorFamily<T, K>
}

export function selectorFamily__INTERNAL<T, K extends Serializable>(
	options: SelectorFamilyOptions<T, K>,
	store?: Store,
): SelectorFamily<T, K>
export function selectorFamily__INTERNAL<T, K extends Serializable>(
	options: ReadonlySelectorFamilyOptions<T, K>,
	store?: Store,
): ReadonlySelectorFamily<T, K>
export function selectorFamily__INTERNAL<T, K extends Serializable>(
	options: ReadonlySelectorFamilyOptions<T, K> | SelectorFamilyOptions<T, K>,
	store: Store = IMPLICIT.STORE,
): ReadonlySelectorFamily<T, K> | SelectorFamily<T, K> {
	const isReadonly = !(`set` in options)

	if (isReadonly) {
		return readonlySelectorFamily__INTERNAL(options, store)
	}
	const core = target(store)
	const subject = new Subject<SelectorToken<T>>()

	return Object.assign(
		(key: K): SelectorToken<T> => {
			const subKey = stringifyJson(key)
			const family: FamilyMetadata = { key: options.key, subKey }
			const fullKey = `${options.key}(${subKey})`
			const existing = core.selectors.get(fullKey)
			if (existing) {
				return deposit(existing)
			}
			const token = selector__INTERNAL<T>(
				{
					key: fullKey,
					get: options.get(key),
					set: options.set(key),
				},
				family,
				store,
			)
			subject.next(token)
			return token
		},
		{
			key: options.key,
			type: `selector_family`,
		} as const,
	) as SelectorFamily<T, K>
}
