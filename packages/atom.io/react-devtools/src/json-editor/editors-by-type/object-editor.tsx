import type { Json } from "atom.io/json"
import type { FC, ReactElement } from "react"
import { useRef } from "react"

import { ElasticInput } from "../../elastic-input"
import type { JsonEditorComponents } from "../default-components"
import type { JsonEditorProps_INTERNAL } from "../json-editor-internal"
import { JsonEditor_INTERNAL } from "../json-editor-internal"
import {
	makePropertyCreationInterface,
	makePropertyRecasters,
	makePropertyRemovers,
	makePropertyRenamers,
	makePropertySetters,
	makePropertySorter,
} from "./utilities/object-properties"

export type PropertyAdderProps = {
	addProperty: () => void
	disabled: boolean
	propertyKey: string
	Components: JsonEditorComponents
}

export const PropertyAdder: FC<PropertyAdderProps> = ({
	addProperty,
	disabled,
	propertyKey,
	Components,
}) => (
	<Components.MissingPropertyWrapper>
		<ElasticInput disabled defaultValue={propertyKey} />
		{` `}
		<ElasticInput disabled defaultValue="is missing" />
		<Components.Button
			onClick={() => {
				addProperty()
			}}
			disabled={disabled}
		>
			+
		</Components.Button>
	</Components.MissingPropertyWrapper>
)

export const ObjectEditor = <T extends Json.Tree.Object>({
	path = [],
	isReadonly = () => false,
	isHidden = () => false,
	data,
	set,
	Components,
}: JsonEditorProps_INTERNAL<T>): ReactElement => {
	const disabled = isReadonly(path)

	const stableKeyMap = useRef<Record<keyof T, keyof T>>(
		Object.keys(data).reduce(
			(acc, key: keyof T) => {
				acc[key] = key
				return acc
			},
			{} as Record<keyof T, keyof T>,
		),
	)

	const setProperty = makePropertySetters(data, set)
	const renameProperty = makePropertyRenamers(data, set, stableKeyMap)
	const removeProperty = makePropertyRemovers(data, set)
	const recastProperty = makePropertyRecasters(data, set)
	const sortProperties = makePropertySorter(data, set)
	const makePropertyAdder = makePropertyCreationInterface(data, set)

	return (
		<>
			<Components.Button
				onClick={() => {
					sortProperties()
				}}
				disabled={disabled}
			>
				Sort
			</Components.Button>
			<Components.ObjectWrapper>
				<div className="json_editor_properties">
					{Object.keys(data).map((key) => {
						const originalKey = stableKeyMap.current[key]
						const newPath = [...path, key]
						const originalPath = [...path, originalKey]

						return (
							<JsonEditor_INTERNAL
								key={originalPath.join(`.`)}
								path={newPath}
								name={key}
								isReadonly={isReadonly}
								isHidden={isHidden}
								data={data[key as keyof T]}
								set={setProperty[key as keyof T]}
								rename={renameProperty[key as keyof T]}
								remove={removeProperty[key as keyof T]}
								recast={recastProperty[key as keyof T]}
								className="json_editor_property"
								Components={Components}
							/>
						)
					})}
				</div>
				{disabled ? (
					<Components.Button disabled>+</Components.Button>
				) : (
					<Components.Button
						data-testid="add-property"
						onClick={() => {
							makePropertyAdder(`new_property`, `string`)()
						}}
					>
						+
					</Components.Button>
				)}
			</Components.ObjectWrapper>
		</>
	)
}
