import type { FC } from "react"

import { isBoolean } from "fp-ts/lib/boolean"
import { isNumber } from "fp-ts/lib/number"
import { isString } from "fp-ts/lib/string"
import type { RecoilState, SetterOrUpdater } from "recoil"
import { useRecoilState } from "recoil"

import { become } from "../fp-tools"
import type { Json, JsonArr, JsonObj, Primitive } from "../json"
import { isPlainObject } from "../json"
import mapObject from "../Luum/src/utils/mapObject"

export const refineJsonType = (
  data: Json
):
  | { type: `array`; data: JsonArr }
  | { type: `boolean`; data: boolean }
  | { type: `null`; data: null }
  | { type: `number`; data: number }
  | { type: `object`; data: JsonObj }
  | { type: `string`; data: string } =>
  data === null
    ? { type: `null`, data }
    : isBoolean(data)
    ? { type: `boolean`, data }
    : isNumber(data)
    ? { type: `number`, data }
    : isString(data)
    ? { type: `string`, data }
    : Array.isArray(data)
    ? { type: `array`, data }
    : isPlainObject(data)
    ? { type: `object`, data }
    : (() => {
        throw new Error(
          `${data} with prototype ${Object.getPrototypeOf(
            data
          )} passed to refineJsonType. This is not a valid JSON type.`
        )
      })()

export type JsonTypeName =
  | `array`
  | `boolean`
  | `null`
  | `number`
  | `object`
  | `string`

export interface JsonTypes extends Record<JsonTypeName, Json> {
  array: JsonArr
  boolean: boolean
  null: null
  number: number
  object: JsonObj
  string: string
}

// export type SubEditorProps<T extends Json | Primitive> = {
//   data: T
//   setData: SetterOrUpdater<T>
// }

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

export const ObjectEditor = <T extends JsonObj>({
  path = [],
  data,
  set,
}: JsonEditorProps<T>): ReturnType<FC> => {
  // console.log(set)
  const setProperty = makePropertySetters(data, set)
  const keys = Object.keys(data)
  return (
    <>
      {keys.map((key) => {
        const newPath = [...path, `[${key}]`]
        return (
          <JsonEditor
            key={newPath.join(``)}
            path={newPath}
            data={data[key as keyof T]}
            set={setProperty[key as keyof T]}
          />
        )
      })}
    </>
  )
}

export const ArrayEditor = <T extends JsonArr>({
  path = [],
  data,
  set,
}: JsonEditorProps<T>): ReturnType<FC> => {
  const setElement = makeElementSetters(data, set)
  return (
    <>
      {data.map((element, index) => {
        const newPath = [...path, `[${index}]`]
        return (
          <JsonEditor
            key={newPath.join(``)}
            path={newPath}
            data={element}
            set={setElement[index]}
          />
        )
      })}
    </>
  )
}

export const BooleanEditor = ({
  path = [],
  data,
  set,
}: JsonEditorProps<boolean>): ReturnType<FC> => (
  <input
    type="checkbox"
    checked={data}
    onChange={(event) => set(event.target.checked)}
  />
)

export const NullEditor = ({
  path = [],
  data,
  set,
}: JsonEditorProps<null>): ReturnType<FC> => (
  <input type="text" value="null" readOnly />
)

export const NumberEditor = ({
  path = [],
  data,
  set,
}: JsonEditorProps<number>): ReturnType<FC> => (
  <div>
    <label htmlFor={path.join(``)}>{path.join(``)}</label>
    <input
      type="number"
      value={data}
      onChange={(event) => set(Number(event.target.value))}
    />
  </div>
)

export const StringEditor = ({
  path = [],
  data,
  set,
}: JsonEditorProps<string>): ReturnType<FC> => (
  <input
    type="text"
    value={data}
    onChange={(event) => set(event.target.value)}
  />
)

export const SubEditors: Record<keyof JsonTypes, FC<JsonEditorProps<any>>> = {
  array: ArrayEditor,
  boolean: BooleanEditor,
  null: NullEditor,
  number: NumberEditor,
  object: ObjectEditor,
  string: StringEditor,
}

export type JsonEditorProps<T extends Json> = {
  path?: string[]
  data: T
  set: SetterOrUpdater<T>
}

type JSX = ReturnType<FC>

export const JsonEditor = <T extends Json>({
  path = [],
  data,
  set,
}: JsonEditorProps<T>): JSX => {
  const json = refineJsonType(data)
  const SubEditor = SubEditors[json.type]

  return (
    <SubEditor
      path={path} // we haven't changed the path yet
      data={json.data}
      set={set}
    />
  )
}
