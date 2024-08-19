import type { Json } from "atom.io/json"
import type { SetterOrUpdater } from "recoil"

import { become } from "~/packages/anvl/src/function"

export const makeElementSetters = <T extends Json.Array>(
	data: T,
	set: SetterOrUpdater<T>,
): SetterOrUpdater<T[number]>[] =>
	data.map((value, index) => (newValue) => {
		set((): T => {
			const newData = [...data]
			newData[index] = become(newValue)(value)
			return newData as unknown as T
		})
	})
