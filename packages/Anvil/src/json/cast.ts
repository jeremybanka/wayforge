import type { Json, JsonArr, JsonObj, Serializable } from "~/packages/Anvil/src/json"
import { refineJsonType } from "~/packages/Anvil/src/json/refine"

export const stringToBoolean = (str: string): boolean => str === `true`
export const stringToNumber = (str: string): number => Number(str)
export const stringToArray = (str: string): string[] => str.split(`,`)
export const stringToObject = (str: string): JsonObj => {
  try {
    return JSON.parse(str)
  } catch (e) {
    return { [str]: str }
  }
}

export const objectToString = (obj: JsonObj): string => JSON.stringify(obj)
export const objectToBoolean = (obj: JsonObj): boolean => obj.true === true
export const objectToNumber = (obj: JsonObj): number =>
  Number(obj.number ?? obj.size ?? obj.count ?? 0)
export const objectToArray = <T extends Serializable>(
  obj: JsonObj<string, T>
): [key: string, value: T][] => Object.entries(obj)

export const booleanToString = (bool: boolean): string => bool.toString()
export const booleanToNumber = (bool: boolean): number => +bool
export const booleanToObject = (bool: boolean): JsonObj => ({
  [bool.toString()]: bool,
})
export const booleanToArray = (bool: boolean): boolean[] => [bool]

export const numberToString = (num: number): string => num.toString()
export const numberToBoolean = (num: number): boolean => num === 1
export const numberToObject = (num: number): JsonObj => ({
  number: num,
})
export const numberToArray = (num: number): null[] => Array(num).fill(null)

export const arrayToString = (arr: JsonArr): string => arr.join(`,`)
export const arrayToNumber = (arr: JsonArr): number => arr.length
export const arrayToBoolean = (arr: JsonArr): boolean =>
  typeof arr[0] === `boolean` ? arr[0] : arr.length > 0
export const arrayToObject = <T extends Serializable>(
  arr: JsonArr<T>
): JsonObj<`${number}`, T> =>
  arr.reduce((acc, cur, idx) => {
    acc[`${idx}`] = cur
    return acc
  }, {} as JsonObj<`${number}`, T>)

export const nullToString = (): string => ``
export const nullToNumber = (): number => 0
export const nullToBoolean = (): boolean => false
export const nullToArray = (): JsonArr => []
export const nullToObject = (): JsonObj => ({})

export const cast = (
  input: Json
): {
  to: {
    array: () => JsonArr
    boolean: () => boolean
    number: () => number
    object: () => JsonObj
    string: () => string
    null: () => null
  }
} => {
  const json = refineJsonType(input)
  return {
    to: {
      array: () => {
        switch (json.type) {
          case `array`:
            return json.data
          case `object`:
            return objectToArray(json.data)
          case `string`:
            return stringToArray(json.data)
          case `boolean`:
            return booleanToArray(json.data)
          case `number`:
            return numberToArray(json.data)
          case `null`:
            return nullToArray()
        }
      },
      boolean: () => {
        switch (json.type) {
          case `array`:
            return arrayToBoolean(json.data)
          case `object`:
            return objectToBoolean(json.data)
          case `string`:
            return stringToBoolean(json.data)
          case `boolean`:
            return json.data
          case `number`:
            return numberToBoolean(json.data)
          case `null`:
            return nullToBoolean()
        }
      },
      number: () => {
        switch (json.type) {
          case `array`:
            return arrayToNumber(json.data)
          case `object`:
            return objectToNumber(json.data)
          case `string`:
            return stringToNumber(json.data)
          case `boolean`:
            return booleanToNumber(json.data)
          case `number`:
            return json.data
          case `null`:
            return nullToNumber()
        }
      },
      object: () => {
        switch (json.type) {
          case `array`:
            return arrayToObject(json.data)
          case `object`:
            return json.data
          case `string`:
            return stringToObject(json.data)
          case `boolean`:
            return booleanToObject(json.data)
          case `number`:
            return numberToObject(json.data)
          case `null`:
            return nullToObject()
        }
      },
      string: () => {
        switch (json.type) {
          case `array`:
            return arrayToString(json.data)
          case `object`:
            return objectToString(json.data)
          case `string`:
            return json.data
          case `boolean`:
            return booleanToString(json.data)
          case `number`:
            return numberToString(json.data)
          case `null`:
            return nullToString()
        }
      },
      null: () => null,
    },
  }
}
