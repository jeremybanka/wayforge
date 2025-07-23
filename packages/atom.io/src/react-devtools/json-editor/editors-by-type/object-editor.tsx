import type { RegularAtomToken } from "atom.io"
import { findInStore } from "atom.io/internal"
import type { Json, JsonTypes } from "atom.io/json"
import { useI } from "atom.io/react/use-i"
import { useO } from "atom.io/react/use-o"
import { DevtoolsContext } from "atom.io/react-devtools/store"
import type { FC, ReactElement } from "react"
import { useContext, useRef } from "react"

import { ElasticInput } from "../../elastic-input"
import type { SetterOrUpdater } from ".."
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

type ObjectPropertyProps = {
	path: ReadonlyArray<number | string>
	isReadonly: (path: ReadonlyArray<number | string>) => boolean
	isHidden: (path: ReadonlyArray<number | string>) => boolean
	data: unknown
	set: SetterOrUpdater<Json.Tree.Object>
	rename: (newKey: string) => void
	remove: (() => void) | undefined
	recast: (newType: keyof JsonTypes) => void
	Components: JsonEditorComponents
	testid?: string | undefined
	viewIsOpenAtom: RegularAtomToken<boolean, readonly (number | string)[]>
}
const ObjectProperty = ({
	path,
	isReadonly,
	isHidden,
	data,
	set,
	rename,
	remove,
	recast,
	Components,
	testid,
	viewIsOpenAtom,
}: ObjectPropertyProps): ReactElement => {
	const key = path[path.length - 1]
	const viewIsOpen = useO(viewIsOpenAtom)
	const setViewIsOpen = useI(viewIsOpenAtom)

	return (
		<JsonEditor_INTERNAL
			path={path}
			name={`${key}`}
			isReadonly={isReadonly}
			isHidden={isHidden}
			data={data}
			set={set}
			rename={rename}
			remove={remove}
			recast={recast}
			className="json_editor_property"
			Components={Components}
			isOpen={viewIsOpen}
			setIsOpen={setViewIsOpen}
			testid={`${testid}-property-${key}`}
		/>
	)
}

export const ObjectEditor = <T extends Json.Tree.Object>({
	path = [],
	isReadonly = () => false,
	isHidden = () => false,
	data,
	set,
	Components,
	testid,
}: JsonEditorProps_INTERNAL<T>): ReactElement => {
	const { viewIsOpenAtoms, store } = useContext(DevtoolsContext)

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
		<Components.ObjectWrapper>
			<div className={`json_editor_properties${disabled ? ` readonly` : ``}`}>
				{Object.keys(data).map((key) => {
					const originalKey = stableKeyMap.current[key]
					const propertyPath = [...path, key]
					const originalPropertyPath = [...path, originalKey]
					const stablePathKey = originalPropertyPath.join(`.`)
					const viewIsOpenAtom = findInStore(store, viewIsOpenAtoms, [
						...path,
						key,
					])

					return (
						<ObjectProperty
							key={stablePathKey}
							path={propertyPath}
							isReadonly={isReadonly}
							isHidden={isHidden}
							data={data[key]}
							set={setProperty[key]}
							rename={renameProperty[key]}
							remove={removeProperty[key]}
							recast={recastProperty[key]}
							Components={Components}
							testid={testid}
							viewIsOpenAtom={viewIsOpenAtom}
						/>
					)
				})}
			</div>
			{disabled ? null : (
				<footer>
					<Components.Button
						disabled={disabled}
						testid={`${testid}-add-property`}
						onClick={() => {
							makePropertyAdder(`new_property`, `string`)()
						}}
					>
						<Components.AddIcon />
					</Components.Button>
					<Components.Button
						testid={`${testid}-sort-properties`}
						onClick={() => {
							sortProperties()
						}}
						disabled={disabled}
					>
						Sort
					</Components.Button>
				</footer>
			)}
		</Components.ObjectWrapper>
	)
}
