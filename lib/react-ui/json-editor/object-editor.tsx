import type { FC } from "react"
import { useRef } from "react"

import { isBoolean } from "fp-ts/lib/boolean"
import { isString } from "fp-ts/lib/string"

import { ifLast } from "~/lib/fp-tools/array"
import type { JsonObj } from "~/lib/json"
import { isPlainObject } from "~/lib/json"
import type { JsonSchema } from "~/lib/json-schema"

import type { JsonEditorProps, JSX } from "."
import { JsonEditor } from "."
import { AutoSizeInput } from "../auto-size-input"
import {
  makePropertyCreationInterface,
  makePropertyRemovers,
  makePropertyRenamers,
  makePropertySetters,
  makePropertySorter,
} from "./object-properties"

export type PropertyAdderProps = {
  addProperty: () => void
  propertyKey: string
}

export const PropertyAdder: FC<PropertyAdderProps> = ({
  addProperty,
  propertyKey,
}) => (
  <div className="__JSON__missing-property">
    <AutoSizeInput disabled defaultValue={propertyKey}></AutoSizeInput>
    <AutoSizeInput disabled defaultValue="is missing"></AutoSizeInput>
    <button onClick={() => addProperty()}>+</button>
  </div>
)

export const ObjectEditor = <T extends JsonObj>({
  schema,
  path = [],
  isReadonly = () => false,
  data,
  set,
  remove,
  rename,
  customCss,
  className,
}: JsonEditorProps<T>): JSX => {
  const stableKeyMap = useRef<Record<keyof T, keyof T>>(
    Object.keys(data).reduce((acc, key: keyof T) => {
      acc[key] = key
      return acc
    }, {} as Record<keyof T, keyof T>)
  )

  const setProperty = makePropertySetters(data, set)
  const renameProperty = makePropertyRenamers(data, set, stableKeyMap)
  const removeProperty = makePropertyRemovers(data, set)
  const sortProperties = makePropertySorter(data, set)
  const makePropertyAdder = makePropertyCreationInterface(data, set)

  const key = ifLast(path)

  const schemaIsObject = typeof schema === `object`
  const subSchema: JsonSchema | undefined = schemaIsObject
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
  const subSchemaIsObject = typeof subSchema === `object`
  if (subSchemaIsObject && subSchema.$ref) {
    const ref = subSchema.$ref
      ?.split(`/`)
      .reduce<JsonSchema | undefined>(
        (acc, key, idx) =>
          idx === 0 && key === `#` ? schema : acc?.[key as keyof typeof acc],
        undefined
      )
    if (isPlainObject(ref)) {
      Object.assign(subSchema, ref)
    }
  }
  const schemaKeys = subSchemaIsObject
    ? Object.keys(subSchema?.properties ?? {})
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
  const missingKeys = schemaKeys.filter((key) => !dataKeys.includes(key))

  return (
    <>
      <button onClick={() => sortProperties()}>Sort</button>: {`{`}
      <div style={{ paddingLeft: 20 }}>
        {[...missingKeys, ...officialKeys, ...unofficialKeys].map((key) => {
          // we hate to see it!
          // TS should know that T[key] is a string, since T extends JsonObj
          const originalKey = stableKeyMap.current[key] as string
          const newPath = [...path, key]
          const originalPath = [...path, originalKey]
          const isOfficial = schemaKeys.includes(key)
          const isMissing = missingKeys.includes(key)
          return isMissing ? (
            <PropertyAdder
              key={key + `IsMissing`}
              propertyKey={key}
              addProperty={makePropertyAdder(key, `string`)}
            />
          ) : (
            <JsonEditor
              key={originalPath.join(``)}
              schema={schema}
              path={newPath}
              isReadonly={isReadonly}
              data={data[key as keyof T]}
              set={setProperty[key as keyof T]}
              rename={renameProperty[key as keyof T]}
              remove={removeProperty[key as keyof T]}
              className={isOfficial ? `` : `__JSON__unofficial`}
            />
          )
        })}
      </div>
      <label>{`}`}</label>
    </>
  )
}
