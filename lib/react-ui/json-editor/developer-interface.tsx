import type { FC, RefObject } from "react"

import type { SerializedStyles } from "@emotion/react"
import type { Json, JsonTypes } from "anvl/json"
import type { JsonSchema } from "anvl/json/json-schema"
import type { SetterOrUpdater } from "recoil"

import type { JsxElements } from "."
import type { JsonEditorComponents } from "./default-components"
import { DEFAULT_JSON_EDITOR_COMPONENTS } from "./default-components"
import { ArrayEditor } from "./editors-by-type/array-editor"
import { ObjectEditor } from "./editors-by-type/object-editor"
import {
  BooleanEditor,
  NullEditor,
  NumberEditor,
  StringEditor,
} from "./editors-by-type/primitive-editors"
import type { JsonEditorProps_INTERNAL } from "./json-editor-internal"
import { JsonEditor_INTERNAL } from "./json-editor-internal"

export const SubEditors: Record<
  keyof JsonTypes,
  FC<JsonEditorProps_INTERNAL<any>>
> = {
  array: ArrayEditor,
  boolean: BooleanEditor,
  null: NullEditor,
  number: NumberEditor,
  object: ObjectEditor,
  string: StringEditor,
}

export type JsonEditorProps<T extends Json> = {
  data: T
  set: SetterOrUpdater<T>
  ref?: RefObject<HTMLInputElement>
  name?: string
  rename?: (newKey: string) => void
  remove?: () => void
  schema?: JsonSchema
  path?: ReadonlyArray<number | string>
  isReadonly?: (path: ReadonlyArray<number | string>) => boolean
  isHidden?: (path: ReadonlyArray<number | string>) => boolean
  className?: string
  customCss?: SerializedStyles
  Header?: FC<{ data: T; schema?: JsonSchema }>
  Components?: Partial<JsonEditorComponents>
}

export const JsonEditor = <T extends Json>({
  data,
  set,
  schema,
  name,
  rename,
  remove,
  isReadonly = () => false,
  isHidden = () => false,
  // isIllegal = () => false,
  className,
  customCss,
  Header,
  Components: CustomComponents = {},
}: JsonEditorProps<T>): JsxElements => {
  const Components = {
    ...DEFAULT_JSON_EDITOR_COMPONENTS,
    ...CustomComponents,
  }
  return (
    <JsonEditor_INTERNAL
      data={data}
      set={set}
      name={name}
      schema={schema}
      rename={rename}
      remove={remove}
      path={[]}
      isReadonly={isReadonly}
      isHidden={isHidden}
      className={className}
      customCss={customCss}
      Header={Header}
      Components={Components}
    />
  )
}
