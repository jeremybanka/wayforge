import type { MutableRefObject } from "react"
import type { SetterOrUpdater } from "recoil"

import { become } from "~/packages/anvl/src/function"
import { JSON_DEFAULTS } from "~/packages/anvl/src/json"
import type { Json, JsonTypeName } from "~/packages/anvl/src/json"
import { mapObject } from "~/packages/anvl/src/object"
import { castToJson } from "~/packages/anvl/src/refinement/smart-cast-json"

export const makePropertySetters = <T extends Json.Object>(
	data: T,
	set: SetterOrUpdater<T>,
): { [K in keyof T]: SetterOrUpdater<T[K]> } =>
	mapObject<keyof T, any, SetterOrUpdater<any>>(
		data,
		(value, key) => (newValue) =>
			set({ ...data, [key]: become(newValue)(value[key]) }),
	)

export const makePropertyRenamers = <T extends Json.Object>(
	data: T,
	set: SetterOrUpdater<T>,
	stableKeyMapRef: MutableRefObject<{ [Key in keyof T]: keyof T }>,
): { [K in keyof T]: (newKey: string) => void } =>
	mapObject<keyof T, any, (newKey: string) => void>(
		data,
		(value, key) => (newKey) =>
			Object.hasOwn(data, newKey)
				? null
				: set(() => {
						const entries = Object.entries(data)
						const index = entries.findIndex(([k]) => k === key)
						entries[index] = [newKey, value]
						const stableKeyMap = stableKeyMapRef.current
						stableKeyMapRef.current = {
							...stableKeyMap,
							[newKey]: stableKeyMap[key],
						}
						return Object.fromEntries(entries) as T
				  }),
	)

export const makePropertyRemovers = <T extends Json.Object>(
	data: T,
	set: SetterOrUpdater<T>,
): { [K in keyof T]: () => void } =>
	mapObject<keyof T, any, () => void>(
		data,
		(_, key) => () =>
			set(() => {
				const { [key]: _, ...rest } = data
				return rest as T
			}),
	)

export const makePropertyRecasters = <T extends Json.Object>(
	data: T,
	set: SetterOrUpdater<T>,
): { [K in keyof T]: (newType: JsonTypeName) => void } =>
	mapObject<keyof T, any, (newType: JsonTypeName) => void>(
		data,
		(value, key) => (newType) =>
			set(() => ({
				...data,
				[key]: castToJson(value).to[newType](),
			})),
	)

export const makePropertyCreationInterface =
	<T extends Json.Object>(
		data: T,
		set: SetterOrUpdater<T>,
	): ((
		key: string,
		type: JsonTypeName,
	) => (value?: Json.Serializable) => void) =>
	(key, type) =>
	(value) =>
		set({ ...data, [key]: value ?? JSON_DEFAULTS[type] })

export const makePropertySorter =
	<T extends Json.Object>(
		data: T,
		set: SetterOrUpdater<T>,
		sortFn?: (a: string, b: string) => number,
	): (() => void) =>
	() => {
		const sortedKeys = Object.keys(data).sort(sortFn)
		const sortedObj = {} as Record<string, unknown>
		for (const key of sortedKeys) {
			sortedObj[key] = data[key]
		}
		set(sortedObj as T)
	}

// export const sortPropertiesAlphabetically = <T extends Json.Object>(data: T): T =>
//   sortProperties(data, (a, b) => a.localeCompare(b))

export const deleteProperty =
	<T extends Json.Object>(
		data: T,
		set: SetterOrUpdater<T>,
	): ((key: keyof T) => void) =>
	(key) => {
		const { [key]: _, ...rest } = data
		set(rest as T)
	}

export const addProperty =
	<T extends Json.Object>(
		data: T,
		set: SetterOrUpdater<T>,
	): ((key?: string, value?: Json.Serializable) => void) =>
	(key, value) => {
		const newKey = key ?? `newProperty`
		const newValue = value ?? ``
		set({ ...data, [newKey]: newValue })
	}
