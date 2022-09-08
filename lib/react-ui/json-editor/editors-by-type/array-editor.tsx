import type { JsonArr } from "~/lib/json"

import type { JsonEditorProps, JsxElements } from ".."
import { JsonEditor } from ".."
import type { JsonEditorProps_INTERNAL } from "../json-editor-internal"
import { JsonEditor_INTERNAL } from "../json-editor-internal"
import { makeElementSetters } from "./utilities/array-elements"

export const ArrayEditor = <T extends JsonArr>({
  path = [],
  isReadonly = () => false,
  data,
  set,
  Components,
}: JsonEditorProps_INTERNAL<JsonArr>): JsxElements => {
  const setElement = makeElementSetters(data, set)
  return (
    <>
      {data.map((element, index) => {
        const newPath = [...path, index]
        return (
          <JsonEditor_INTERNAL
            key={newPath.join(``)}
            path={newPath}
            isReadonly={isReadonly}
            data={element}
            set={setElement[index]}
            Components={Components}
          />
        )
      })}
    </>
  )
}
