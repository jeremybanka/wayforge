import type { Json } from "atom.io/json"

export const stringToBoolean = (str: string): boolean => str === `true`
export const stringToNumber = (str: string): number => Number(str)
export const stringToArray = (str: string): string[] => str.split(`,`)
export const stringToObject = (str: string): Json.Tree.Fork.Obj => {
	try {
		return JSON.parse(str)
	} catch (e) {
		return { [str]: str }
	}
}

export const objectToString = (obj: Json.Tree.Fork.Obj): string =>
	JSON.stringify(obj)
export const objectToBoolean = (obj: Json.Tree.Fork.Obj): boolean =>
	obj.true === true
export const objectToNumber = (obj: Json.Tree.Fork.Obj): number =>
	Number(obj.number ?? obj.size ?? obj.count ?? 0)
export const objectToArray = <T>(
	obj: Json.Tree.Fork.Obj<string, T>,
): [key: string, value: T][] => Object.entries(obj)

export const booleanToString = (bool: boolean): string => bool.toString()
export const booleanToNumber = (bool: boolean): number => +bool
export const booleanToObject = (bool: boolean): Json.Tree.Fork.Obj => ({
	[bool.toString()]: bool,
})
export const booleanToArray = (bool: boolean): boolean[] => [bool]

export const numberToString = (num: number): string => num.toString()
export const numberToBoolean = (num: number): boolean => num === 1
export const numberToObject = (num: number): Json.Tree.Fork.Obj => ({
	number: num,
})
export const numberToArray = (num: number): null[] => Array(num).fill(null)

export const arrayToString = (arr: Json.Tree.Fork.Arr): string => arr.join(`,`)
export const arrayToNumber = (arr: Json.Tree.Fork.Arr): number => arr.length
export const arrayToBoolean = (arr: Json.Tree.Fork.Arr): boolean =>
	typeof arr[0] === `boolean` ? arr[0] : arr.length > 0
export const arrayToObject = <T>(
	arr: Json.Tree.Fork.Arr<T>,
): Json.Tree.Fork.Obj<`${number}`, T> =>
	arr.reduce(
		(acc, cur, idx) => {
			acc[`${idx}`] = cur
			return acc
		},
		{} as Json.Tree.Fork.Obj<`${number}`, T>,
	)

export const nullToString = (): string => ``
export const nullToNumber = (): number => 0
export const nullToBoolean = (): boolean => false
export const nullToArray = (): Json.Tree.Fork.Arr => []
export const nullToObject = (): Json.Tree.Fork.Obj => ({})
