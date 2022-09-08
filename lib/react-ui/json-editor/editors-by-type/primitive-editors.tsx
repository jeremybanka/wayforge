import type { JsxElements } from ".."
import { NumberInput } from "../../number-input"
import { TextInput } from "../../text-input"
import type { JsonEditorProps_INTERNAL } from "../json-editor-internal"

export const BooleanEditor = ({
  path = [],
  isReadonly = () => false,
  data,
  set,
}: JsonEditorProps_INTERNAL<boolean>): JsxElements => (
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
}: JsonEditorProps_INTERNAL<null>): JsxElements => (
  <input type="text" value="null" readOnly />
)

export const NumberEditor = ({
  path = [],
  isReadonly = () => false,
  data,
  set,
}: JsonEditorProps_INTERNAL<number>): JsxElements => (
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
  Components,
}: JsonEditorProps_INTERNAL<string>): JsxElements => {
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
