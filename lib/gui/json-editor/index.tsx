import type { FC } from "react"
import { useMemo } from "react"

import { isBoolean } from "fp-ts/lib/boolean"
import { isNumber } from "fp-ts/lib/number"
import { isString } from "fp-ts/lib/string"
import type { SetterOrUpdater } from "recoil"

import { become } from "~/lib/fp-tools"
import { ifLast } from "~/lib/fp-tools/array"
import type { Json, JsonArr, JsonObj } from "~/lib/json"
import { isPlainObject } from "~/lib/json"
import type { JsonSchema } from "~/lib/json-schema"
import mapObject from "~/lib/Luum/src/utils/mapObject"

import { NumberInput } from "../number-input"
import { TextInput } from "../text-input"
import { makeElementSetters, makePropertySetters } from "./setters"

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
          )} passed to refineJsonType. This is not valid JSON.`
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

// export const Label = ({ children }: { children?: string }) => (

export const ObjectEditor = <T extends JsonObj>({
  schema,
  path = [],
  isReadonly = () => false,
  data,
  set,
}: JsonEditorProps<T>): ReturnType<FC> => {
  const setProperty = makePropertySetters(data, set)
  const schemaIsObject = typeof schema === `object`
  const subschema: JsonSchema | undefined = schemaIsObject
    ? path.reduce<JsonSchema | undefined>(
        (acc, key) =>
          acc && !isBoolean(acc)
            ? isString(key)
              ? acc.properties?.[key]
              : acc.items
            : undefined,
        schema
      )
    : undefined
  console.log(subschema)
  const subschemaIsObject = typeof subschema === `object`
  if (subschemaIsObject && subschema.$ref) {
    const ref = subschema.$ref
      ?.split(`/`)
      .reduce<JsonSchema | undefined>(
        (acc, key, idx) =>
          idx === 0 && key === `#` ? schema : acc?.[key as keyof typeof acc],
        undefined
      )
    if (isPlainObject(ref)) {
      Object.assign(subschema, ref)
    }
  }
  const schemaKeys = subschemaIsObject
    ? Object.keys(subschema?.properties ?? {})
    : []
  const dataKeys = Object.keys(data)
  const [unofficialKeys, officialKeys] = dataKeys.reduce(
    ([unofficial, official], key) => {
      const isOfficial = schemaIsObject && schemaKeys.includes(key)
      return isOfficial
        ? [unofficial, [...official, key]]
        : [[...unofficial, key], official]
    },
    [[], []] as [string[], string[]]
  )
  const missingKeys = schemaIsObject

  return (
    <div>
      <label>
        <span>{ifLast(path)}</span>: {`{`}
      </label>
      <div style={{ paddingLeft: 20 }}>
        {officialKeys.map((key) => {
          const newPath = [...path, key]
          return (
            <JsonEditor
              key={newPath.join(``)}
              schema={schema}
              path={newPath}
              isReadonly={isReadonly}
              data={data[key as keyof T]}
              set={setProperty[key as keyof T]}
            />
          )
        })}
        <div style={{ backgroundColor: `#8882` }}>
          {unofficialKeys.map((key) => {
            const newPath = [...path, key]
            return (
              <JsonEditor
                key={newPath.join(``)}
                path={newPath}
                isReadonly={isReadonly}
                data={data[key as keyof T]}
                set={setProperty[key as keyof T]}
              />
            )
          })}
        </div>
      </div>
      <label>{`}`}</label>
    </div>
  )
}

export const ArrayEditor = <T extends JsonArr>({
  path = [],
  isReadonly = () => false,
  data,
  set,
}: JsonEditorProps<T>): ReturnType<FC> => {
  const setElement = makeElementSetters(data, set)
  return (
    <>
      {data.map((element, index) => {
        const newPath = [...path, index]
        return (
          <JsonEditor
            key={newPath.join(``)}
            path={newPath}
            isReadonly={isReadonly}
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
  isReadonly = () => false,
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
  isReadonly = () => false,
  data,
  set,
}: JsonEditorProps<null>): ReturnType<FC> => (
  <input type="text" value="null" readOnly />
)

export const NumberEditor = ({
  path = [],
  isReadonly = () => false,
  data,
  set,
}: JsonEditorProps<number>): ReturnType<FC> => (
  <NumberInput
    label={String(ifLast(path))}
    value={data}
    set={isReadonly(path) ? undefined : set}
  />
)

export const StringEditor = ({
  path = [],
  isReadonly = () => false,
  data,
  set,
}: JsonEditorProps<string>): ReturnType<FC> => (
  <TextInput
    label={String(ifLast(path))}
    value={data}
    set={isReadonly(path) ? undefined : set}
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
  schema?: JsonSchema
  path?: ReadonlyArray<number | string>
  isReadonly?: (path: ReadonlyArray<number | string>) => boolean
  data: T
  set: SetterOrUpdater<T>
}

type JSX = ReturnType<FC> // return for FunctionComponents w Generic Props

export const JsonEditor = <T extends Json>({
  schema,
  path = [],
  isReadonly = () => false,
  data,
  set,
}: JsonEditorProps<T>): JSX => {
  const json = refineJsonType(data)
  // const root = path[0] // memoize tail
  const SubEditor = SubEditors[json.type]

  return (
    <SubEditor
      schema={schema}
      path={path} // path only changes with each element or property
      isReadonly={isReadonly}
      data={json.data}
      set={set}
    />
  )
}
