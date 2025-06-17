import type { FC } from "react"
import { useState } from "react"

import type {
	ErrorBoundaryProps,
	ErrorBoundaryState,
} from "~/packages/atom.io/src/react-devtools/error-boundary"
import {
	DefaultFallback,
	ErrorBoundary,
} from "~/packages/atom.io/src/react-devtools/error-boundary"

export const RecoverableErrorBoundary: FC<ErrorBoundaryProps> = ({
	children,
	Fallback = DefaultFallback,
	useErrorState,
	resetErrorState,
}) => {
	const internalState = useState<ErrorBoundaryState>({})
	const externalState = useErrorState?.()
	const [{ error }, setError] = externalState ?? internalState
	const resetError =
		resetErrorState ??
		(() => {
			setError({})
		})
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
