import type { SetterOrUpdater } from "recoil"

import { become } from "~/packages/anvl/src/function"
import type { JsonArr } from "~/packages/anvl/src/json"

export const makeElementSetters = <T extends JsonArr>(
	data: T,
	set: SetterOrUpdater<T>,
): SetterOrUpdater<T[number]>[] =>
	data.map(
		(value, index) => (newValue) =>
			set((): T => {
				const newData = [...data]
				newData[index] = become(newValue)(value)
				return newData as unknown as T
			}),
	)
