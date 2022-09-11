import type { FC } from "react"
import { useRef } from "react"

import { isBoolean } from "fp-ts/lib/boolean"
import { isString } from "fp-ts/lib/string"
import type { SetterOrUpdater } from "recoil"

import { ifLast as lastOf } from "~/lib/fp-tools/array"
import type { Json, JsonObj } from "~/lib/json"
import { isPlainObject } from "~/lib/json"
import type { JsonSchema } from "~/lib/json/json-schema"

import type { JsxElements } from ".."
import { JsonEditor } from ".."
import { AutoSizeInput } from "../../auto-size-input"
import type { JsonEditorComponents } from "../default-components"
import type { JsonEditorProps_INTERNAL } from "../json-editor-internal"
import { JsonEditor_INTERNAL } from "../json-editor-internal"
import {
  makePropertyCreationInterface,
  makePropertyRecasters,
  makePropertyRemovers,
  makePropertyRenamers,
  makePropertySetters,
  makePropertySorter,
} from "./utilities/object-properties"

export type PropertyAdderProps = {
  addProperty: () => void
  propertyKey: string
  Components: JsonEditorComponents
}

export const PropertyAdder: FC<PropertyAdderProps> = ({
  addProperty,
  propertyKey,
  Components,
}) => (
  <Components.MissingPropertyWrapper>
    <AutoSizeInput disabled defaultValue={propertyKey}></AutoSizeInput>
    <AutoSizeInput disabled defaultValue="is missing"></AutoSizeInput>
    <Components.Button onClick={() => addProperty()}>+</Components.Button>
  </Components.MissingPropertyWrapper>
)

export const ObjectEditor = <T extends JsonObj>({
  schema,
  path = [],
  isReadonly = () => false,
  data,
  set,
  // remove,
  // rename,
  // recast,
  customCss,
  className,
  Components,
}: JsonEditorProps_INTERNAL<T>): JsxElements => {
  const stableKeyMap = useRef<Record<keyof T, keyof T>>(
    Object.keys(data).reduce((acc, key: keyof T) => {
      acc[key] = key
      return acc
    }, {} as Record<keyof T, keyof T>)
  )

  const setProperty = makePropertySetters(data, set)
  const renameProperty = makePropertyRenamers(data, set, stableKeyMap)
  const removeProperty = makePropertyRemovers(data, set)
  const recastProperty = makePropertyRecasters(data, set)
  const sortProperties = makePropertySorter(data, set)
  const makePropertyAdder = makePropertyCreationInterface(data, set)

  const parentKey = lastOf(path)

  const schemaIsObject = typeof schema === `object`
  const subSchema: JsonSchema | undefined = schemaIsObject
    ? path.reduce<JsonSchema | undefined>((acc, key) => {
        const hasSchema = acc && !isBoolean(acc)
        const keyIsString = isString(key)
        const nextLayer = hasSchema
          ? keyIsString
            ? acc.properties?.[key]
            : acc.items
          : undefined

        return nextLayer
      }, schema)
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
      const isOfficial = subSchemaIsObject && schemaKeys.includes(key)
      return isOfficial
        ? [unofficial, [...official, key]]
        : [[...unofficial, key], official]
    },
    [[], []] as [string[], string[]]
  )
  const missingKeys = schemaKeys.filter((key) => !dataKeys.includes(key))

  return (
    <>
      <Components.Button onClick={() => sortProperties()}>
        Sort
      </Components.Button>
      <Components.ObjectWrapper>
        <div className="json_editor_properties">
          {[...missingKeys, ...officialKeys, ...unofficialKeys].map((key) => {
            // we hate to see it!
            // TS should know that keyof T is a string, since T extends JsonObj
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
                Components={Components}
              />
            ) : (
              <JsonEditor_INTERNAL
                key={originalPath.join(`.`)}
                schema={schema}
                path={newPath}
                name={key}
                isReadonly={isReadonly}
                data={data[key as keyof T]}
                set={setProperty[key as keyof T]}
                rename={renameProperty[key as keyof T]}
                remove={removeProperty[key as keyof T]}
                recast={recastProperty[key as keyof T]}
                className={`json_editor_property ${
                  isOfficial ? `json_editor_official` : `json_editor_unofficial`
                }`}
                Components={Components}
              />
            )
          })}
        </div>
        <Components.Button
          onClick={() => makePropertyAdder(`new_property`, `string`)()}
        >
          +
        </Components.Button>
      </Components.ObjectWrapper>
    </>
  )
}
