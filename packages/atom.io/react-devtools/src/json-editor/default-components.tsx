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

	EditorLayout: FC<{
		DeleteButton?: FC
		Header?: FC
		KeyInput?: FC
		TypeSelect?: FC
		ValueEditor: FC
		Wrapper: WC
	}>
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

	MiscastPropertyWrapper: WC
	MissingPropertyWrapper: WC
	OfficialPropertyWrapper: WC
	UnofficialPropertyWrapper: WC
	IllegalPropertyWrapper: WC
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
	EditorLayout: ({
		DeleteButton,
		Header,
		KeyInput,
		TypeSelect,
		ValueEditor,
		Wrapper,
	}) => {
		return (
			<Wrapper>
				{DeleteButton && <DeleteButton />}
				{Header && <Header />}
				{KeyInput && <KeyInput />}
				{TypeSelect && <TypeSelect />}
				<ValueEditor />
			</Wrapper>
		)
	},
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
	MissingPropertyWrapper: ({ children, testid }) => (
		<div
			className="json_editor_property json_editor_missing"
			data-testid={testid}
		>
			{children}
		</div>
	),
	MiscastPropertyWrapper: ({ children, testid }) => (
		<div
			className="json_editor_property json_editor_miscast"
			data-testid={testid}
		>
			{children}
		</div>
	),
	IllegalPropertyWrapper: ({ children, testid }) => (
		<span
			className="json_editor_property json_editor_illegal"
			data-testid={testid}
		>
			{children}
		</span>
	),
	OfficialPropertyWrapper: ({ children, testid }) => (
		<span
			className="json_editor_property json_editor_official"
			data-testid={testid}
		>
			{children}
		</span>
	),
	UnofficialPropertyWrapper: ({ children, testid }) => (
		<span
			className="json_editor_property json_editor_unofficial"
			data-testid={testid}
		>
			{children}
		</span>
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
