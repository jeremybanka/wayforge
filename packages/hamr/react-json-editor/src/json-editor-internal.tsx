import { ElasticInput } from "../../react-elastic-input"

import type { CSSProperties, FC, ReactElement } from "react"
import type { SetterOrUpdater } from "recoil"

import { doNothing } from "~/packages/anvl/src/function"
import type { Json, JsonTypes } from "~/packages/anvl/src/json"
import type { JsonSchema } from "~/packages/anvl/src/json-schema/json-schema"
import {
	isJson,
	refineJsonType,
} from "~/packages/anvl/src/refinement/refine-json"

import { SubEditors } from "."
import type { JsonEditorComponents } from "./default-components"
import { NonJsonEditor } from "./editors-by-type/non-json"

export type JsonEditorProps_INTERNAL<T extends Json.Serializable> = {
	data: T
	set: SetterOrUpdater<T>
	name?: string | undefined
	rename?: ((newKey: string) => void) | undefined
	remove?: (() => void) | undefined
	recast?: (newType: keyof JsonTypes) => void
	schema?: JsonSchema | undefined
	path?: ReadonlyArray<number | string>
	isReadonly?: (path: ReadonlyArray<number | string>) => boolean
	isHidden?: (path: ReadonlyArray<number | string>) => boolean
	className?: string | undefined
	style?: CSSProperties | undefined
	Header?: FC<{ data: T; schema?: JsonSchema | undefined }> | undefined
	Components: JsonEditorComponents
}

export const JsonEditor_INTERNAL = <T extends Json.Serializable>({
	data,
	set,
	schema,
	name,
	rename,
	remove,
	recast,
	path = [],
	isReadonly = () => false,
	isHidden = () => false,
	className,
	style,
	Header: HeaderDisplay,
	Components,
}: JsonEditorProps_INTERNAL<T>): ReactElement | null => {
	const dataIsJson = isJson(data)
	const refined = dataIsJson ? refineJsonType(data) : { type: `non-json`, data }
	const SubEditor = dataIsJson ? SubEditors[refined.type] : NonJsonEditor

	const disabled = isReadonly(path)

	return isHidden(path) ? null : (
		<Components.ErrorBoundary>
			<Components.EditorWrapper className={className} style={style}>
				{remove && (
					<Components.Button
						onClick={disabled ? doNothing : remove}
						disabled={disabled}
					>
						<Components.DeleteIcon />
					</Components.Button>
				)}
				{HeaderDisplay && <HeaderDisplay data={data} schema={schema} />}
				{rename && (
					<Components.KeyWrapper>
						<ElasticInput
							value={name}
							onChange={disabled ? doNothing : (e) => rename(e.target.value)}
							disabled={disabled}
						/>
					</Components.KeyWrapper>
				)}
				<SubEditor
					data={refined.data}
					set={set}
					schema={schema}
					remove={remove}
					rename={rename}
					path={path}
					isReadonly={isReadonly}
					isHidden={isHidden}
					Components={Components}
				/>
				{recast && dataIsJson ? (
					<select
						onChange={
							disabled
								? doNothing
								: (e) => recast(e.target.value as keyof JsonTypes)
						}
						value={refined.type}
						disabled={disabled}
					>
						{Object.keys(SubEditors).map((type) => (
							<option key={type} value={type}>
								{type}
							</option>
						))}
					</select>
				) : null}
			</Components.EditorWrapper>
		</Components.ErrorBoundary>
	)
}
