import type { JsonTypes } from "atom.io/json"
import type { FC } from "react"

import { ArrayEditor } from "./editors-by-type/array-editor"
import { ObjectEditor } from "./editors-by-type/object-editor"
import {
	BooleanEditor,
	NullEditor,
	NumberEditor,
	StringEditor,
} from "./editors-by-type/primitive-editors"
import type { JsonEditorProps_INTERNAL } from "./json-editor-internal"

export * from "./default-components"
export * from "./developer-interface"
export * from "./editors-by-type/utilities/cast-to-json"

export type SetterOrUpdater<T> = <New extends T>(
	next: New | ((old: T) => New),
) => void

export const SubEditors = {
	array: ArrayEditor,
	boolean: BooleanEditor,
	null: NullEditor,
	number: NumberEditor,
	object: ObjectEditor,
	string: StringEditor,
} satisfies Record<keyof JsonTypes, FC<JsonEditorProps_INTERNAL<any>>>
