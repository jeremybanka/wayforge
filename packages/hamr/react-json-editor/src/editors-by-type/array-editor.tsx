import type { ReactElement } from "react"

import type { Json } from "~/packages/anvl/src/json"

import type { JsonEditorProps_INTERNAL } from "../json-editor-internal"
import { JsonEditor_INTERNAL } from "../json-editor-internal"
import { makeElementSetters } from "./utilities/array-elements"

export const ArrayEditor = <_ extends Json.Array>({
	path = [],
	isReadonly = () => false,
	isHidden = () => false,
	data,
	set,
	Components,
}: JsonEditorProps_INTERNAL<Json.Array>): ReactElement => {
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
					/>
				)
			})}
		</>
	)
}
