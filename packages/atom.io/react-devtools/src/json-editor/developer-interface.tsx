import type { Json } from "atom.io/json"
import type { CSSProperties, FC, ReactElement } from "react"

import type { JsonTypes } from "~/packages/anvl/src/json"

import type { JsonEditorComponents } from "./default-components"
import { DEFAULT_JSON_EDITOR_COMPONENTS } from "./default-components"
import { ArrayEditor } from "./editors-by-type/array-editor"
import { ObjectEditor } from "./editors-by-type/object-editor"
import {
	BooleanEditor,
	NullEditor,
	NumberEditor,
	StringEditor,
} from "./editors-by-type/primitive-editors"
import type { JsonEditorProps_INTERNAL } from "./json-editor-internal"
import { JsonEditor_INTERNAL } from "./json-editor-internal"

export const SubEditors: Record<
	keyof JsonTypes,
	FC<JsonEditorProps_INTERNAL<any>>
> = {
	array: ArrayEditor,
	boolean: BooleanEditor,
	null: NullEditor,
	number: NumberEditor,
	object: ObjectEditor,
	string: StringEditor,
}

export type JsonEditorProps<T extends Json.Tree.Node> = {
	data: T
	set: (valOrUpdater: T | ((currVal: T) => T)) => void
	name?: string | undefined
	rename?: ((newKey: string) => void) | undefined
	remove?: () => void
	path?: ReadonlyArray<number | string>
	isReadonly?: (path: ReadonlyArray<number | string>) => boolean
	isHidden?: (path: ReadonlyArray<number | string>) => boolean
	className?: string
	style?: CSSProperties
	Header?: FC<{ data: T }>
	Components?: Partial<JsonEditorComponents>
}

export const JsonEditor = <T extends Json.Tree.Node>({
	data,
	set,
	name,
	rename,
	remove,
	isReadonly = () => false,
	isHidden = () => false,
	className,
	Header,
	style,
	Components: CustomComponents = {},
}: JsonEditorProps<T>): ReactElement => {
	const Components = {
		...DEFAULT_JSON_EDITOR_COMPONENTS,
		...CustomComponents,
	}

	return (
		<JsonEditor_INTERNAL
			data={data}
			set={set}
			name={name}
			rename={rename}
			remove={remove}
			path={[]}
			isReadonly={isReadonly}
			isHidden={isHidden}
			className={className}
			Header={Header}
			style={style}
			Components={Components}
		/>
	)
}
