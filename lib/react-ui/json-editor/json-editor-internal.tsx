import type { FC, ReactNode, RefObject } from "react"

import type { SerializedStyles } from "@emotion/react"
import { isString } from "fp-ts/lib/string"
import type { SetterOrUpdater } from "recoil"

import { lastOf } from "~/lib/Anvil/array"
import type { Json, JsonTypes } from "~/lib/json"
import type { JsonSchema } from "~/lib/json/json-schema"
import { refineJsonType } from "~/lib/json/refine"

import type { JsxElements } from "."
import { SubEditors } from "."
import { AutoSizeInput } from "../auto-size-input"
import type { JsonEditorComponents, WC } from "./default-components"

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
  // isIllegal = () => false,
  className,
  customCss,
  Header: HeaderDisplay,
  Components,
}: JsonEditorProps_INTERNAL<T>): JsxElements => {
  const json = refineJsonType(data)
  const SubEditor = SubEditors[json.type]

  const key = lastOf(path)
  const disabled = isReadonly(path)

  // const DeleteButton = remove
  //   ? () => (
  //       <Components.Button onClick={remove}>
  //         <Components.DeleteIcon />
  //       </Components.Button>
  //     )
  //   : undefined
  // const Header = HeaderDisplay
  //   ? () => <HeaderDisplay data={data} schema={schema} />
  //   : undefined
  // const KeyInput = isString(key)
  //   ? () => (
  //       <Components.KeyWrapper>
  //         <AutoSizeInput
  //           value={key}
  //           onChange={
  //             rename && !disabled ? (e) => rename(e.target.value) : () => null
  //           }
  //           disabled={disabled}
  //         />
  //       </Components.KeyWrapper>
  //     )
  //   : undefined
  // const TypeSelect = recast
  //   ? () => (
  //       <select
  //         onChange={(e) => recast(e.target.value as keyof JsonTypes)}
  //         value={json.type}
  //       >
  //         {Object.keys(SubEditors).map((type) => (
  //           <option key={type} value={type}>
  //             {type}
  //           </option>
  //         ))}
  //       </select>
  //     )
  //   : undefined
  // const ValueEditor = () => (
  //   <SubEditor
  //     data={json.data}
  //     set={set}
  //     schema={schema}
  //     remove={remove}
  //     rename={rename}
  //     path={path}
  //     isReadonly={isReadonly}
  //     Components={Components}
  //   />
  // )
  // const Wrapper: WC = ({ children }) => (
  //   <Components.EditorWrapper className={className} customCss={customCss}>
  //     {children}
  //   </Components.EditorWrapper>
  // )

  return isHidden(path) ? null : (
    <Components.ErrorBoundary>
      <Components.EditorWrapper className={className} customCss={customCss}>
        {remove && (
          <Components.Button onClick={remove}>
            <Components.DeleteIcon />
          </Components.Button>
        )}
        {HeaderDisplay && <HeaderDisplay data={data} schema={schema} />}
        {rename && (
          <Components.KeyWrapper>
            <AutoSizeInput
              value={name}
              onChange={
                rename && !disabled ? (e) => rename(e.target.value) : () => null
              }
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
            onChange={(e) => recast(e.target.value as keyof JsonTypes)}
            value={json.type}
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
