import { become } from "~/packages/Anvil/src/function"
import type { JsonArr } from "~/packages/Anvil/src/json"
import type { SetterOrUpdater } from "recoil"

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
