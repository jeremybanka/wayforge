import { type Json, JSON_DEFAULTS } from "atom.io/json"
import type { ReactElement } from "react"

import type { JsonEditorProps_INTERNAL } from "../json-editor-internal"
import { JsonEditor_INTERNAL } from "../json-editor-internal"
import { makeElementSetters } from "./utilities/array-elements"
import {
	makePropertyRecasters,
	makePropertyRemovers,
} from "./utilities/object-properties"

export const ArrayEditor = ({
	path = [],
	isReadonly = () => false,
	isHidden = () => false,
	data,
	set,
	Components,
	testid,
}: JsonEditorProps_INTERNAL<Json.Tree.Array>): ReactElement => {
	const disabled = isReadonly(path)

	const setElement = makeElementSetters(data, set)
	const removeElement = makePropertyRemovers(data, set)
	const recastElement = makePropertyRecasters(data, set)

	return (
		<Components.ArrayWrapper>
			<div className={`json_editor_elements${disabled ? ` readonly` : ``}`}>
				{data.map((element, index) => {
					const newPath = [...path, index]
					return (
						<JsonEditor_INTERNAL
							key={newPath.join(``)}
							path={newPath}
							name={`${index}`}
							isReadonly={isReadonly}
							isHidden={isHidden}
							data={element}
							set={setElement[index]}
							remove={removeElement[index]}
							recast={recastElement[index]}
							className="json_editor_element"
							Components={Components}
							testid={`${testid}-element-${index}`}
						/>
					)
				})}
			</div>
			{disabled ? null : (
				<Components.Button
					testid={`${testid}-add-element`}
					disabled={disabled}
					onClick={() => {
						set((current) => {
							const newData = [...current, JSON_DEFAULTS.string]
							return newData
						})
					}}
				>
					+
				</Components.Button>
			)}
		</Components.ArrayWrapper>
	)
}
