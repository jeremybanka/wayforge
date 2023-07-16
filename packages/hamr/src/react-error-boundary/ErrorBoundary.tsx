import type { ErrorInfo, ReactNode, FC } from "react"
import { useId, Component } from "react"
import { atomFamily, useRecoilState, useResetRecoilState } from "recoil"

import type { FallbackProps } from "./DefaultFallback"
import { DefaultFallback } from "./DefaultFallback"

export type ErrorBoundaryState = {
	error?: Error | string
	errorInfo?: ErrorInfo
}

export type ErrorBoundaryProps = {
	children: ReactNode
	onError?: (error: Error | string, errorInfo: ErrorInfo) => void
	Fallback?: FC<FallbackProps>
}

export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	public constructor(props: ErrorBoundaryProps) {
		super(props)
		this.state = { error: undefined, errorInfo: undefined }
		// We can filter or add information
		// to airbrake notifications here:
	}

	public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		this.props.onError?.(error, errorInfo)
		this.setState({
			error,
			errorInfo,
		})
	}

	public override render(): ReactNode {
		const { error, errorInfo } = this.state
		const { children, Fallback = DefaultFallback } = this.props

		return errorInfo ? (
			<Fallback error={error} errorInfo={errorInfo} />
		) : (
			(children as ReactNode)
		)
	}
}

export const findErrorBoundaryState = atomFamily<ErrorBoundaryState, string>({
	key: `errorBoundary`,
	default: { error: undefined, errorInfo: undefined },
})

export const RecoverableErrorBoundary: FC<ErrorBoundaryProps> = ({
	children,
	Fallback = DefaultFallback,
}) => {
	const nodeId = useId()
	const [{ error }, setError] = useRecoilState(findErrorBoundaryState(nodeId))
	const resetError = useResetRecoilState(findErrorBoundaryState(nodeId))
	const hasError = Boolean(error)

	return hasError ? (
		<div>
			<button type="button" onClick={resetError}>
				Reset
			</button>
			<ErrorBoundary Fallback={Fallback}>{children}</ErrorBoundary>
		</div>
	) : (
		<ErrorBoundary
			Fallback={Fallback}
			onError={(newError, newErrorInfo) =>
				setError({ error: newError, errorInfo: newErrorInfo })
			}
		>
			{children}
		</ErrorBoundary>
	)
}
