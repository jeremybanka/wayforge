import type { Json } from "atom.io/json"

export const stringToBoolean = (str: string): boolean => str === `true`
export const stringToNumber = (str: string): number => Number(str)
export const stringToArray = (str: string): string[] => str.split(`,`)
export const stringToObject = (str: string): Json.Tree.Object => {
	try {
		return JSON.parse(str)
	} catch (e) {
		return { [str]: str }
	}
}

export const objectToString = (obj: Json.Tree.Object): string =>
	JSON.stringify(obj)
export const objectToBoolean = (obj: Json.Tree.Object): boolean =>
	obj.true === true
export const objectToNumber = (obj: Json.Tree.Object): number =>
	Number(obj.number ?? obj.size ?? obj.count ?? 0)
export const objectToArray = <T>(
	obj: Json.Tree.Object<string, T>,
): [key: string, value: T][] => Object.entries(obj)

export const booleanToString = (bool: boolean): string => bool.toString()
export const booleanToNumber = (bool: boolean): number => +bool
export const booleanToObject = (bool: boolean): Json.Tree.Object => ({
	[bool.toString()]: bool,
})
export const booleanToArray = (bool: boolean): boolean[] => [bool]

export const numberToString = (num: number): string => num.toString()
export const numberToBoolean = (num: number): boolean => num === 1
export const numberToObject = (num: number): Json.Tree.Object => ({
	number: num,
})
export const numberToArray = (num: number): null[] => Array(num).fill(null)

export const arrayToString = (arr: Json.Tree.Array): string => arr.join(`,`)
export const arrayToNumber = (arr: Json.Tree.Array): number => arr.length
export const arrayToBoolean = (arr: Json.Tree.Array): boolean =>
	typeof arr[0] === `boolean` ? arr[0] : arr.length > 0
export const arrayToObject = <T>(
	arr: Json.Tree.Array<T>,
): Json.Tree.Object<`${number}`, T> =>
	arr.reduce(
		(acc, cur, idx) => {
			acc[`${idx}`] = cur
			return acc
		},
		{} as Json.Tree.Object<`${number}`, T>,
	)

export const nullToString = (): string => ``
export const nullToNumber = (): number => 0
export const nullToBoolean = (): boolean => false
export const nullToArray = (): Json.Tree.Array => []
export const nullToObject = (): Json.Tree.Object => ({})
