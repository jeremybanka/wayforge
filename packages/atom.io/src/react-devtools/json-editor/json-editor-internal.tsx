import { actUponStore, arbitrary } from "atom.io/internal"
import { jsonRefinery } from "atom.io/introspection"
import type { JsonTypes } from "atom.io/json"
import { isJson } from "atom.io/json"
import {
	type CSSProperties,
	type FC,
	type ReactElement,
	useContext,
} from "react"

import { button } from "../Button"
import { ElasticInput } from "../elastic-input"
import { DevtoolsContext } from "../store"
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
	isOpen?: boolean
	setIsOpen?: (newValue: boolean) => void
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
	Components,
	isOpen,
	setIsOpen,
	testid,
}: JsonEditorProps_INTERNAL<T>): ReactElement | null => {
	const { openCloseAllTX, store } = useContext(DevtoolsContext)

	const dataIsJson = isJson(data)
	const refined = jsonRefinery.refine<unknown>(data) ?? {
		type: `non-json`,
		data,
	}
	const SubEditor = dataIsJson
		? SubEditors[refined.type as keyof JsonTypes]
		: NonJsonEditor

	const disabled = isReadonly(path)

	const dataIsTree = refined.type === `array` || refined.type === `object`
	const dataIsExpandable = dataIsTree && isOpen !== undefined && setIsOpen

	let stringified: string
	try {
		stringified = JSON.stringify(data)
	} catch (_) {
		stringified = `?`
	}

	return isHidden(path) ? null : (
		<Components.ErrorBoundary>
			<Components.EditorWrapper
				className={className}
				style={style}
				testid={testid}
			>
				<header>
					<main>
						{remove || dataIsExpandable ? (
							<button.OpenClose
								isOpen={isOpen ?? false}
								testid={`${testid}-open-close`}
								onShiftClick={() => {
									actUponStore(store, openCloseAllTX, arbitrary())(path, isOpen)
									return false
								}}
								setIsOpen={setIsOpen}
								disabled={!dataIsExpandable}
							/>
						) : null}
						{rename && (
							<Components.KeyWrapper>
								<ElasticInput
									value={name}
									onChange={(e) => {
										rename(e.target.value)
									}}
									disabled={disabled}
									data-testid={`${testid}-rename`}
								/>
							</Components.KeyWrapper>
						)}
						{dataIsTree ? (
							<>
								{isOpen !== undefined && setIsOpen ? (
									<span className="json_viewer">{stringified}</span>
								) : null}
								{recast ? (
									<select
										onChange={(e) => {
											recast(e.target.value as keyof JsonTypes)
										}}
										value={refined.type}
										disabled={disabled}
										data-testid={`${testid}-recast`}
									>
										{Object.keys(SubEditors).map((type) => (
											<option key={type} value={type}>
												{type}
											</option>
										))}
									</select>
								) : null}
							</>
						) : (
							<>
								<SubEditor
									data={refined.data as never}
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
										data-testid={`${testid}-recast`}
									>
										{Object.keys(SubEditors).map((type) => (
											<option key={type} value={type}>
												{type}
											</option>
										))}
									</select>
								) : null}
							</>
						)}
					</main>
					{remove ? (
						<Components.Button
							disabled={disabled}
							onClick={() => {
								remove()
							}}
							testid={`${testid}-delete`}
						>
							<Components.DeleteIcon />
						</Components.Button>
					) : null}
				</header>

				{dataIsTree && isOpen !== false ? (
					<SubEditor
						data={refined.data as never}
						set={set}
						remove={remove}
						rename={rename}
						path={path}
						isReadonly={isReadonly}
						isHidden={isHidden}
						Components={Components}
						testid={testid}
					/>
				) : null}
			</Components.EditorWrapper>
		</Components.ErrorBoundary>
	)
}
