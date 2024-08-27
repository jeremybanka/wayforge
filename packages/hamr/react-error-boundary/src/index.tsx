import type { FC } from "react"
import { useState } from "react"

import type {
	ErrorBoundaryProps,
	ErrorBoundaryState,
} from "~/packages/atom.io/react-devtools/src/error-boundary"
import {
	DefaultFallback,
	ErrorBoundary,
} from "~/packages/atom.io/react-devtools/src/error-boundary"

export * from "~/packages/atom.io/react-devtools/src/error-boundary"

export const RecoverableErrorBoundary: FC<ErrorBoundaryProps> = ({
	children,
	Fallback = DefaultFallback,
	useErrorState = () => useState<ErrorBoundaryState>({}),
	useResetErrorState,
}) => {
	const [{ error }, setError] = useErrorState()
	const resetError = useResetErrorState
		? useResetErrorState()
		: () => {
				setError({})
			}
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
			onError={(newError, newErrorInfo) => {
				setError({ error: newError, errorInfo: newErrorInfo })
			}}
		>
			{children}
		</ErrorBoundary>
	)
}
