import type { SetterOrUpdater } from "recoil"

import { become } from "~/lib/fp-tools"
import type { JsonArr } from "~/lib/json"

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
