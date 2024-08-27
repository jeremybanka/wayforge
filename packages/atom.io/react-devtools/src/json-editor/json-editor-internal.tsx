import { jsonRefinery } from "atom.io/introspection"
import type { JsonTypes } from "atom.io/json"
import { isJson } from "atom.io/json"
import type { CSSProperties, FC, ReactElement } from "react"

import { ElasticInput } from "../elastic-input"
import type { SetterOrUpdater } from "."
import { SubEditors } from "."
import type { JsonEditorComponents } from "./default-components"
import { NonJsonEditor } from "./editors-by-type/non-json"

export type JsonEditorProps_INTERNAL<T> = {
	data: T
	set: SetterOrUpdater<T>
	name?: string | undefined
	rename?: ((newKey: string) => void) | undefined
	remove?: (() => void) | undefined
	recast?: (newType: keyof JsonTypes) => void
	path?: ReadonlyArray<number | string>
	isReadonly?: (path: ReadonlyArray<number | string>) => boolean
	isHidden?: (path: ReadonlyArray<number | string>) => boolean
	className?: string | undefined
	style?: CSSProperties | undefined
	Header?: FC<{ data: T }> | undefined
	Components: JsonEditorComponents
	testid?: string | undefined
}

export const JsonEditor_INTERNAL = <T,>({
	data,
	set,
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
	testid,
}: JsonEditorProps_INTERNAL<T>): ReactElement | null => {
	const dataIsJson = isJson(data)
	const refined = jsonRefinery.refine<unknown>(data) ?? {
		type: `non-json`,
		data,
	}
	const SubEditor = dataIsJson ? SubEditors[refined.type] : NonJsonEditor

	const disabled = isReadonly(path)

	return isHidden(path) ? null : (
		<Components.ErrorBoundary>
			<Components.EditorWrapper
				className={className}
				style={style}
				testid={testid}
			>
				{remove ? (
					disabled ? (
						<Components.Button disabled>
							<Components.DeleteIcon />
						</Components.Button>
					) : (
						<Components.Button
							onClick={() => {
								remove()
							}}
						>
							<Components.DeleteIcon />
						</Components.Button>
					)
				) : null}
				{HeaderDisplay && <HeaderDisplay data={data} />}
				{rename && (
					<Components.KeyWrapper>
						<ElasticInput
							value={name}
							onChange={
								disabled
									? undefined
									: (e) => {
											rename(e.target.value)
										}
							}
							disabled={disabled}
						/>
					</Components.KeyWrapper>
				)}
				<SubEditor
					data={refined.data}
					set={set}
					remove={remove}
					rename={rename}
					path={path}
					isReadonly={isReadonly}
					isHidden={isHidden}
					Components={Components}
					testid={testid}
				/>
				{recast && dataIsJson ? (
					<select
						onChange={
							disabled
								? undefined
								: (e) => {
										recast(e.target.value as keyof JsonTypes)
									}
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
