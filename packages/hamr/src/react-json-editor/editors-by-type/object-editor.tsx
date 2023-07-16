import { useRef } from "react"
import type { FC, ReactElement } from "react"

import { doNothing } from "~/packages/anvl/src/function"
import type { JsonObj } from "~/packages/anvl/src/json"
import { findSubSchema } from "~/packages/anvl/src/json-schema/find-sub-schema"
import { isObjectSchema } from "~/packages/anvl/src/json-schema/json-schema"
import { isPlainObject } from "~/packages/anvl/src/object/refinement"
import { isLiteral } from "~/packages/anvl/src/refinement"

import {
	makePropertyCreationInterface,
	makePropertyRecasters,
	makePropertyRemovers,
	makePropertyRenamers,
	makePropertySetters,
	makePropertySorter,
} from "./utilities/object-properties"
import { ElasticInput } from "../../react-elastic-input"
import type { JsonEditorComponents } from "../default-components"
import type { JsonEditorProps_INTERNAL } from "../json-editor-internal"
import { JsonEditor_INTERNAL } from "../json-editor-internal"

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
		{/* ❗ rome advised self-closing these, remove once tested */}
		<ElasticInput disabled defaultValue="is missing" />
		<Components.Button onClick={() => addProperty()} disabled={disabled}>
			+
		</Components.Button>
	</Components.MissingPropertyWrapper>
)

export const ObjectEditor = <T extends JsonObj>({
	schema,
	path = [],
	isReadonly = () => false,
	isHidden = () => false,
	data,
	set,
	Components,
}: JsonEditorProps_INTERNAL<T>): ReactElement => {
	const disabled = isReadonly(path)

	const stableKeyMap = useRef<Record<keyof T, keyof T>>(
		Object.keys(data).reduce((acc, key: keyof T) => {
			acc[key] = key
			return acc
		}, {} as Record<keyof T, keyof T>),
	)

	const setProperty = makePropertySetters(data, set)
	const renameProperty = makePropertyRenamers(data, set, stableKeyMap)
	const removeProperty = makePropertyRemovers(data, set)
	const recastProperty = makePropertyRecasters(data, set)
	const sortProperties = makePropertySorter(data, set)
	const makePropertyAdder = makePropertyCreationInterface(data, set)

	const subSchema = isPlainObject(schema) ? findSubSchema(schema)(path) : true
	const schemaKeys: ReadonlyArray<string> | true = isLiteral(true)(subSchema)
		? true
		: isObjectSchema(subSchema)
		? Object.keys(subSchema.properties ?? {})
		: []
	const dataKeys: ReadonlyArray<string> = Object.keys(data)
	const [unofficialKeys, officialKeys] = dataKeys.reduce(
		([unofficial, official], key) => {
			const isOfficial = schemaKeys === true || schemaKeys.includes(key)
			return isOfficial
				? [unofficial, [...official, key]]
				: [[...unofficial, key], official]
		},
		[[], []] as [string[], string[]],
	)
	const missingKeys: ReadonlyArray<string> =
		schemaKeys === true
			? []
			: schemaKeys.filter((key) => !dataKeys.includes(key))

	return (
		<>
			<Components.Button onClick={() => sortProperties()} disabled={disabled}>
				Sort
			</Components.Button>
			<Components.ObjectWrapper>
				<div className="json_editor_properties">
					{[...missingKeys, ...officialKeys, ...unofficialKeys].map((key) => {
						const originalKey = stableKeyMap.current[key]
						const newPath = [...path, key]
						const originalPath = [...path, originalKey]
						const isOfficial = schemaKeys === true || schemaKeys.includes(key)
						const isMissing = missingKeys.includes(key)

						return isMissing ? (
							<PropertyAdder
								key={key + `IsMissing`}
								propertyKey={key}
								addProperty={makePropertyAdder(key, `string`)}
								disabled={disabled}
								Components={Components}
							/>
						) : (
							<JsonEditor_INTERNAL
								key={originalPath.join(`.`)}
								schema={schema}
								path={newPath}
								name={key}
								isReadonly={isReadonly}
								isHidden={isHidden}
								data={data[key as keyof T]}
								set={setProperty[key as keyof T]}
								rename={renameProperty[key as keyof T]}
								remove={removeProperty[key as keyof T]}
								recast={recastProperty[key as keyof T]}
								className={`json_editor_property ${
									isOfficial ? `json_editor_official` : `json_editor_unofficial`
								}`}
								Components={Components}
							/>
						)
					})}
				</div>
				<Components.Button
					onClick={
						disabled
							? doNothing
							: () => makePropertyAdder(`new_property`, `string`)()
					}
					disabled={disabled}
				>
					+
				</Components.Button>
			</Components.ObjectWrapper>
		</>
	)
}
