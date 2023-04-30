import type { ReactElement } from "react"

import { NumberInput, TextInput } from "../../react-elastic-input"
import type { JsonEditorProps_INTERNAL } from "../json-editor-internal"

export const BooleanEditor = ({
  data,
  set,
}: JsonEditorProps_INTERNAL<boolean>): ReactElement => (
  <input
    type="checkbox"
    checked={data}
    onChange={(event) => set(event.target.checked)}
  />
)

export const NullEditor = (): ReactElement => (
  <input type="text" value="null" readOnly />
)

export const NumberEditor = ({
  path = [],
  isReadonly = () => false,
  data,
  set,
}: JsonEditorProps_INTERNAL<number>): ReactElement => (
  <NumberInput
    value={data}
    set={isReadonly(path) ? undefined : (newValue) => set(Number(newValue))}
    autoSize={true}
  />
)

export const StringEditor = ({
  path = [],
  isReadonly = () => false,
  data,
  set,
  Components,
}: JsonEditorProps_INTERNAL<string>): ReactElement => {
  return (
    <Components.StringWrapper>
      <TextInput
        value={data}
        set={isReadonly(path) ? undefined : set}
        autoSize={true}
      />
    </Components.StringWrapper>
  )
}
