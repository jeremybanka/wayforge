declare module "react-syntax-highlighter" {
	import * as preact from "preact"

	export interface SyntaxHighlighterProps {
		language?: string | undefined
		style?: { [key: string]: React.CSSProperties } | undefined
		children: string | string[]
		customStyle?: React.CSSProperties | undefined
		codeTagProps?: React.HTMLProps<HTMLElement> | undefined
		useInlineStyles?: boolean | undefined
		showLineNumbers?: boolean | undefined
		showInlineLineNumbers?: boolean | undefined
		startingLineNumber?: number | undefined
		lineNumberContainerStyle?: React.CSSProperties | undefined
		lineNumberStyle?: React.CSSProperties | lineNumberStyleFunction | undefined
		wrapLines?: boolean | undefined
		wrapLongLines?: boolean | undefined
		lineProps?: lineTagPropsFunction | React.HTMLProps<HTMLElement> | undefined
		renderer?: (props: rendererProps) => React.ReactNode
		PreTag?:
			| keyof React.JSX.IntrinsicElements
			| React.ComponentType<any>
			| undefined
		CodeTag?:
			| keyof React.JSX.IntrinsicElements
			| React.ComponentType<any>
			| undefined
		[spread: string]: any
	}
	export class Prism extends preact.Component<SyntaxHighlighterProps> {
		static supportedLanguages: string[]
	}
}
