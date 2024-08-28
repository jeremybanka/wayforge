import type { Json } from "atom.io/json"
import type { ReactElement } from "react"

import type { JsonEditorProps_INTERNAL } from "../json-editor-internal"
import { JsonEditor_INTERNAL } from "../json-editor-internal"
import { makeElementSetters } from "./utilities/array-elements"

export const ArrayEditor = ({
	path = [],
	isReadonly = () => false,
	isHidden = () => false,
	data,
	set,
	Components,
	testid,
}: JsonEditorProps_INTERNAL<Json.Tree.Array>): ReactElement => {
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
						isHidden={isHidden}
						data={element}
						set={setElement[index]}
						Components={Components}
						className="json_editor_element"
						testid={`${testid}-element-${index}`}
					/>
				)
			})}
		</>
	)
}
