import type { FC, RefObject } from "react"

import type { SerializedStyles } from "@emotion/react"
import { isString } from "fp-ts/lib/string"
import type { SetterOrUpdater } from "recoil"

import { ifLast } from "~/lib/fp-tools/array"
import type { Json, JsonTypes } from "~/lib/json"
import type { JsonSchema } from "~/lib/json-schema"
import { refineJsonType } from "~/lib/json/refine"

import { AutoSizeInput } from "../auto-size-input"
import { NumberInput } from "../number-input"
import { TextInput } from "../text-input"
import { ArrayEditor } from "./array-editor"
import { ObjectEditor } from "./object-editor"

// export const Label = ({ children }: { children?: string }) => (

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
    value={data}
    set={isReadonly(path) ? undefined : set}
    autoSize={true}
  />
)

export const StringEditor = ({
  path = [],
  isReadonly = () => false,
  data,
  set,
  remove,
  rename,
  className,
}: JsonEditorProps<string>): ReturnType<FC> => {
  return (
    <TextInput
      value={data}
      set={isReadonly(path) ? undefined : set}
      autoSize={true}
    />
  )
}

export const SubEditors: Record<keyof JsonTypes, FC<JsonEditorProps<any>>> = {
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
  rename?: (newKey: string) => void
  remove?: () => void
  schema?: JsonSchema
  path?: ReadonlyArray<number | string>
  isReadonly?: (path: ReadonlyArray<number | string>) => boolean
  className?: string
  customCss?: SerializedStyles
}

export type JSX = ReturnType<FC>

export const JsonEditor = <T extends Json>({
  data,
  set,
  schema,
  rename,
  remove,
  path = [],
  isReadonly = () => false,
  className,
  customCss,
}: JsonEditorProps<T>): JSX => {
  const json = refineJsonType(data)
  const SubEditor = SubEditors[json.type]

  const key = ifLast(path)
  const disabled = isReadonly(path)

  return (
    <div className={className} css={customCss}>
      {isString(key) && (
        <AutoSizeInput
          value={key}
          onChange={
            rename && !disabled ? (e) => rename(e.target.value) : () => null
          }
          disabled={disabled}
        />
      )}
      <SubEditor
        data={json.data}
        set={set}
        schema={schema}
        remove={remove}
        rename={rename}
        path={path}
        isReadonly={isReadonly}
        className={className}
      />
      {remove && <button onClick={() => remove()}>x</button>}
    </div>
  )
}
