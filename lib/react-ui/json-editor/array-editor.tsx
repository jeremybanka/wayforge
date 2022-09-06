import type { JsonArr } from "~/lib/json"

import type { JsonEditorProps, JSX } from "."
import { JsonEditor } from "."
import { makeElementSetters } from "./array-elements"

export const ArrayEditor = <T extends JsonArr>({
  path = [],
  isReadonly = () => false,
  data,
  set,
}: JsonEditorProps<T>): JSX => {
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
