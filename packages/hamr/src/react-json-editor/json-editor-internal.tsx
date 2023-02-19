import type { FC, RefObject } from "react"

import type { SerializedStyles } from "@emotion/react"
import type { SetterOrUpdater } from "recoil"

import { doNothing } from "~/packages/anvl/src/function"
import type { Json, JsonTypes } from "~/packages/anvl/src/json"
import { refineJsonType } from "~/packages/anvl/src/json/refine"
import type { JsonSchema } from "~/packages/anvl/src/json-schema/json-schema"

import type { JsxElements } from "."
import { SubEditors } from "."
import type { JsonEditorComponents } from "./default-components"
import { AutoSizeInput } from "../react-ui/auto-size-input"

export type JsonEditorProps_INTERNAL<T extends Json> = {
  data: T
  set: SetterOrUpdater<T>
  ref?: RefObject<HTMLInputElement>
  name?: string
  rename?: (newKey: string) => void
  remove?: () => void
  recast?: (newType: keyof JsonTypes) => void
  schema?: JsonSchema
  path?: ReadonlyArray<number | string>
  isReadonly?: (path: ReadonlyArray<number | string>) => boolean
  isHidden?: (path: ReadonlyArray<number | string>) => boolean
  className?: string
  customCss?: SerializedStyles
  Header?: FC<{ data: T; schema?: JsonSchema }>
  Components: JsonEditorComponents
}

export const JsonEditor_INTERNAL = <T extends Json>({
  data,
  set,
  schema,
  name,
  rename,
  remove,
  recast,
  path = [],
  isReadonly = () => false,
  isHidden = () => false,
  className,
  customCss,
  Header: HeaderDisplay,
  Components,
}: JsonEditorProps_INTERNAL<T>): JsxElements => {
  const json = refineJsonType(data)
  const SubEditor = SubEditors[json.type]

  const disabled = isReadonly(path)

  return isHidden(path) ? null : (
    <Components.ErrorBoundary>
      <Components.EditorWrapper className={className} customCss={customCss}>
        {remove && (
          <Components.Button
            onClick={disabled ? doNothing : remove}
            disabled={disabled}
          >
            <Components.DeleteIcon />
          </Components.Button>
        )}
        {HeaderDisplay && <HeaderDisplay data={data} schema={schema} />}
        {rename && (
          <Components.KeyWrapper>
            <AutoSizeInput
              value={name}
              onChange={disabled ? doNothing : (e) => rename(e.target.value)}
              disabled={disabled}
            />
          </Components.KeyWrapper>
        )}
        <SubEditor
          data={json.data}
          set={set}
          schema={schema}
          remove={remove}
          rename={rename}
          path={path}
          isReadonly={isReadonly}
          isHidden={isHidden}
          Components={Components}
        />
        {recast && (
          <select
            onChange={
              disabled
                ? doNothing
                : (e) => recast(e.target.value as keyof JsonTypes)
            }
            value={json.type}
            disabled={disabled}
          >
            {Object.keys(SubEditors).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        )}
      </Components.EditorWrapper>
    </Components.ErrorBoundary>
  )
}
