import type { SetterOrUpdater } from "recoil"

import { become } from "~/lib/fp-tools"
import type { JsonArr, JsonObj } from "~/lib/json"
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

export const makeElementSetters = <T extends JsonArr>(
  data: T,
  set: SetterOrUpdater<T>
): SetterOrUpdater<T[number]>[] =>
  data.map(
    (value, index) => (newValue) =>
      set((): T => {
        const newData = [...data]
        newData[index] = become(newValue)(value)
        return newData as unknown as T
      })
  )
