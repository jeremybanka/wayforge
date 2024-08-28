import type { CSSProperties, FC, ReactNode } from "react"

import { ErrorBoundary } from "../error-boundary"

export type Dict<T> = Record<string, T>

export type WrapperComponent<T extends Dict<unknown> = Dict<unknown>> = FC<
	T & { children: ReactNode; testid?: string | undefined }
>

export type WC<T extends Dict<unknown> = Dict<unknown>> = WrapperComponent<T>

export type JsonEditorComponents = {
	ErrorBoundary: WC

	Button: WC<{
		onClick?: () => void
		disabled?: boolean
	}>
	DeleteIcon: FC

	EditorWrapper: WC<{
		style?: CSSProperties | undefined
		className?: string | undefined
		testid?: string | undefined
	}>

	ArrayWrapper: WC
	ObjectWrapper: WC
	StringWrapper: WC
	NumberWrapper: WC
	BooleanWrapper: WC
	Null: FC<{ testid?: string | undefined }>

	KeyWrapper: WC
}

export const DEFAULT_JSON_EDITOR_COMPONENTS: JsonEditorComponents = {
	ErrorBoundary: ({ children }) => <ErrorBoundary>{children}</ErrorBoundary>,
	Button: ({ onClick, children, disabled, testid }) => (
		<button
			type="button"
			className="json_editor_button"
			onClick={onClick}
			disabled={disabled}
			data-testid={testid}
		>
			{children}
		</button>
	),
	EditorWrapper: ({ children, className, testid }) => (
		<div
			className={`json_editor` + (className ? ` ${className}` : ``)}
			data-testid={testid}
		>
			{children}
		</div>
	),
	ArrayWrapper: ({ children, testid }) => (
		<div className="json_editor_array" data-testid={testid}>
			{children}
		</div>
	),
	ObjectWrapper: ({ children, testid }) => (
		<div className="json_editor_object" data-testid={testid}>
			{children}
		</div>
	),
	StringWrapper: ({ children, testid }) => (
		<span className="json_editor_string" data-testid={testid}>
			{children}
		</span>
	),
	NumberWrapper: ({ children, testid }) => (
		<span className="json_editor_number" data-testid={testid}>
			{children}
		</span>
	),
	BooleanWrapper: ({ children, testid }) => (
		<span className="json_editor_boolean" data-testid={testid}>
			{children}
		</span>
	),
	Null: ({ testid }) => (
		<span className="json_editor_null" data-testid={testid} />
	),
	DeleteIcon: () => (
		<span className="json_editor_icon json_editor_delete">x</span>
	),
	KeyWrapper: ({ children, testid }) => (
		<span className="json_editor_key" data-testid={testid}>
			{children}
		</span>
	),
}
