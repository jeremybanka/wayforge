import type { SerializedStyles } from "@emotion/react"
import type { FC, ReactNode } from "react"

import { ErrorBoundary } from "../react-error-boundary"

export type Dict<T> = Record<string, T>

export type WrapperComponent<T extends Dict<unknown> = Dict<unknown>> = FC<
	T & { children: ReactNode }
>

export type WC<T extends Dict<unknown> = Dict<unknown>> = WrapperComponent<T>

export type JsonEditorComponents = {
	ErrorBoundary: WC

	Button: WC<{ onClick: () => void; disabled: boolean }>
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
		customCss?: SerializedStyles | undefined
		className?: string | undefined
	}>

	ArrayWrapper: WC
	ObjectWrapper: WC
	StringWrapper: WC
	NumberWrapper: WC
	BooleanWrapper: WC
	NullWrapper: WC

	MiscastPropertyWrapper: WC
	MissingPropertyWrapper: WC
	OfficialPropertyWrapper: WC
	UnofficialPropertyWrapper: WC
	IllegalPropertyWrapper: WC
	KeyWrapper: WC
}

export const DEFAULT_JSON_EDITOR_COMPONENTS: JsonEditorComponents = {
	ErrorBoundary: ({ children }) => <ErrorBoundary>{children}</ErrorBoundary>,
	Button: ({ onClick, children, disabled }) => (
		<button
			type="button"
			className="json_editor_button"
			onClick={onClick}
			disabled={disabled}
		>
			{children}
		</button>
	),
	EditorWrapper: ({ children, customCss, className }) => (
		<div className={`json_editor` + ` ` + className ?? ``} css={customCss}>
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
	ArrayWrapper: ({ children }) => (
		<div className="json_editor_array">{children}</div>
	),
	ObjectWrapper: ({ children }) => (
		<div className="json_editor_object">{children}</div>
	),
	StringWrapper: ({ children }) => (
		<span className="json_editor_string">{children}</span>
	),
	NumberWrapper: ({ children }) => (
		<span className="json_editor_number">{children}</span>
	),
	BooleanWrapper: ({ children }) => (
		<span className="json_editor_boolean">{children}</span>
	),
	NullWrapper: ({ children }) => (
		<span className="json_editor_null">{children}</span>
	),
	MissingPropertyWrapper: ({ children }) => (
		<div className="json_editor_property json_editor_missing">{children}</div>
	),
	MiscastPropertyWrapper: ({ children }) => (
		<div className="json_editor_property json_editor_miscast">{children}</div>
	),
	IllegalPropertyWrapper: ({ children }) => (
		<span className="json_editor_property json_editor_illegal">{children}</span>
	),
	OfficialPropertyWrapper: ({ children }) => (
		<span className="json_editor_property json_editor_official">{children}</span>
	),
	UnofficialPropertyWrapper: ({ children }) => (
		<span className="json_editor_property json_editor_unofficial">
			{children}
		</span>
	),
	DeleteIcon: () => (
		<span className="json_editor_icon json_editor_delete">x</span>
	),
	KeyWrapper: ({ children }) => (
		<span className="json_editor_key">{children}</span>
	),
}
