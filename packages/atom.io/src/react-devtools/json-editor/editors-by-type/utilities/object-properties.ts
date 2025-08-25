import { become } from "atom.io/internal"
import type { Json, JsonTypeName } from "atom.io/json"
import { fromEntries, JSON_DEFAULTS, toEntries } from "atom.io/json"
import type { RefObject } from "react"

import type { SetterOrUpdater } from "../.."
import { castToJson } from "./cast-to-json"

export const makePropertySetters = <T extends Json.Tree.Object>(
	data: T,
	set: SetterOrUpdater<T>,
): { [K in keyof T]: SetterOrUpdater<T[K]> } =>
	fromEntries(
		toEntries(data).map(([key, value]) => [
			key,
			(newValue: unknown) => {
				set({ ...data, [key]: become(newValue, value) })
			},
		]),
	)

export const makePropertyRenamers = <T extends Json.Tree.Object>(
	data: T,
	set: SetterOrUpdater<T>,
	stableKeyMapRef: RefObject<{ [Key in keyof T]: keyof T }>,
): { [K in keyof T]: (newKey: string) => void } =>
	fromEntries(
		toEntries(data).map(([key, value]) => [
			key,
			(newKey: string) => {
				if (!Object.hasOwn(data, newKey)) {
					set(() => {
						const entries = Object.entries(data)
						const index = entries.findIndex(([k]) => k === key)
						entries[index] = [newKey, value]
						const stableKeyMap = stableKeyMapRef.current
						stableKeyMapRef.current = {
							...stableKeyMap,
							[newKey]: stableKeyMap[key],
						}
						return Object.fromEntries(entries) as T
					})
				}
			},
		]),
	)

export const makePropertyRemovers = <
	T extends Json.Tree.Array | Json.Tree.Object,
>(
	data: T,
	set: SetterOrUpdater<T>,
): { [K in keyof T]: () => void } =>
	fromEntries(
		toEntries(data).map(([key]) => [
			key,
			() => {
				set(() => {
					let next: T
					if (Array.isArray(data)) {
						const copy = [...data]
						copy.splice(key as number, 1)
						next = copy as unknown as T
					} else {
						const { [key]: _, ...rest } = data
						next = rest as T
					}
					return next
				})
			},
		]),
	)

export const makePropertyRecasters = <
	T extends Json.Tree.Array | Json.Tree.Object,
>(
	data: T,
	set: SetterOrUpdater<T>,
): { [K in keyof T]: (newType: JsonTypeName) => void } =>
	fromEntries(
		toEntries(data).map(([key, value]) => [
			key,
			(newType: JsonTypeName) => {
				set(() => {
					let next: T
					if (Array.isArray(data)) {
						const copy = [...data]
						copy[key as number] = castToJson(value)[newType]
						next = copy as unknown as T
					} else {
						next = {
							...data,
							[key]: castToJson(value)[newType],
						}
					}
					return next
				})
			},
		]),
	)

export const makePropertyCreationInterface =
	<T extends Json.Tree.Object>(
		data: T,
		set: SetterOrUpdater<T>,
	): ((
		key: string,
		type: JsonTypeName,
	) => (value?: Json.Serializable) => void) =>
	(key, type) =>
	(value) => {
		set({ ...data, [key]: value ?? JSON_DEFAULTS[type] })
	}

export const makePropertySorter =
	<T extends Json.Tree.Object>(
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
