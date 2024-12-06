import type {
	ErrorBoundaryProps,
	ErrorBoundaryState,
} from "hamr/react-error-boundary"
import { RecoverableErrorBoundary as ReactErrorBoundary } from "hamr/react-error-boundary"
import type { FC } from "react"
import { useId } from "react"
import { atomFamily, setState } from "atom.io"
import { useI, useO } from "atom.io/react"

export const findErrorBoundaryState = atomFamily<ErrorBoundaryState, string>({
	key: `errorBoundary`,
	default: {},
})

export const RecoverableErrorBoundary: FC<ErrorBoundaryProps> = ({
	children,
	onError,
	Fallback,
}) => {
	const id = useId()
	return (
		<ReactErrorBoundary
			onError={onError}
			Fallback={Fallback}
			useErrorState={() => [
				useO(findErrorBoundaryState, id),
				useI(findErrorBoundaryState, id),
			]}
			useResetErrorState={() => () => setState(findErrorBoundaryState, id, {})}
		>
			{children}
		</ReactErrorBoundary>
	)
}
