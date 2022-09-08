import type { MutableRefObject } from "react"

import type { SetterOrUpdater } from "recoil"

import { become } from "~/lib/fp-tools"
import type { Json, JsonObj, JsonTypeName } from "~/lib/json"
import { JSON_DEFAULTS } from "~/lib/json"
import { cast } from "~/lib/json/cast"
import mapObject from "~/lib/Luum/src/utils/mapObject"

export const makePropertySetters = <T extends JsonObj>(
  data: T,
  set: SetterOrUpdater<T>
): { [K in keyof T]: SetterOrUpdater<T[K]> } =>
  mapObject<T, any, SetterOrUpdater<any>>(
    data,
    (value, key) => (newValue) =>
      set({ ...data, [key]: become(newValue)(value[key]) })
  )

export const makePropertyRenamers = <T extends JsonObj>(
  data: T,
  set: SetterOrUpdater<T>,
  stableKeyMapRef: MutableRefObject<{ [K in keyof T]: keyof T }>
): { [K in keyof T]: (newKey: string) => void } =>
  mapObject<T, any, (newKey: string) => void>(
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
          })
  )

export const makePropertyRemovers = <T extends JsonObj>(
  data: T,
  set: SetterOrUpdater<T>
): { [K in keyof T]: () => void } =>
  mapObject<T, any, () => void>(
    data,
    (_, key) => () =>
      set(() => {
        const { [key]: _, ...rest } = data
        return rest as T
      })
  )

export const makePropertyRecasters = <T extends JsonObj>(
  data: T,
  set: SetterOrUpdater<T>
): { [K in keyof T]: (newType: JsonTypeName) => void } =>
  mapObject<T, any, (newType: JsonTypeName) => void>(
    data,
    (value, key) => (newType) =>
      set(() => ({
        ...data,
        [key]: cast(value).to[newType](),
      }))
  )

export const makePropertyCreationInterface =
  <T extends JsonObj>(
    data: T,
    set: SetterOrUpdater<T>
  ): ((key: string, type: JsonTypeName) => (value?: Json) => void) =>
  (key, type) =>
  (value) =>
    set({ ...data, [key]: value ?? JSON_DEFAULTS[type] })

export const makePropertySorter =
  <T extends JsonObj>(
    data: T,
    set: SetterOrUpdater<T>,
    sortFn?: (a: string, b: string) => number
  ): (() => void) =>
  () => {
    const sortedKeys = Object.keys(data).sort(sortFn)
    const sortedObj = {} as Record<string, unknown>
    sortedKeys.forEach((key) => (sortedObj[key] = data[key]))
    set(sortedObj as T)
  }

// export const sortPropertiesAlphabetically = <T extends JsonObj>(data: T): T =>
//   sortProperties(data, (a, b) => a.localeCompare(b))

export const deleteProperty =
  <T extends JsonObj>(
    data: T,
    set: SetterOrUpdater<T>
  ): ((key: keyof T) => void) =>
  (key) => {
    const { [key]: _, ...rest } = data
    set(rest as T)
  }

export const addProperty =
  <T extends JsonObj>(
    data: T,
    set: SetterOrUpdater<T>
  ): ((key?: string, value?: Json) => void) =>
  (key, value) => {
    const newKey = key ?? `newProperty`
    const newValue = value ?? ``
    set({ ...data, [newKey]: newValue })
  }
