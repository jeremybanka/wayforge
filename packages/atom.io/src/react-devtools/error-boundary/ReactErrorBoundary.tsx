import type { ErrorInfo, FC, ReactNode } from "react"
import { Component } from "react"

import type { FallbackProps } from "./DefaultFallback"
import { DefaultFallback } from "./DefaultFallback"

export type ErrorBoundaryState = {
	error?: Error | string
	errorInfo?: ErrorInfo
}

export type ErrorBoundaryProps = {
	children: ReactNode
	onError?: ((error: Error | string, errorInfo: ErrorInfo) => void) | undefined
	Fallback?: FC<FallbackProps> | undefined
	resetErrorState?: () => void
	useErrorState?: () => [
		ErrorBoundaryState,
		(
			newState:
				| ErrorBoundaryState
				| ((currState: ErrorBoundaryState) => ErrorBoundaryState),
		) => void,
	]
}

export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	public constructor(props: ErrorBoundaryProps) {
		super(props)
		this.state = {}
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
			children
		)
	}
}
