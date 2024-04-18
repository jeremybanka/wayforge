import type {
	ErrorBoundaryProps,
	ErrorBoundaryState,
} from "hamr/react-error-boundary"
import { RecoverableErrorBoundary as ReactErrorBoundary } from "hamr/react-error-boundary"
import type { FC } from "react"
import { useId } from "react"
import { atomFamily, useRecoilState, useResetRecoilState } from "recoil"

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
			useErrorState={() => useRecoilState(findErrorBoundaryState(id))}
			useResetErrorState={() =>
				useResetRecoilState(findErrorBoundaryState(useId()))
			}
		>
			{children}
		</ReactErrorBoundary>
	)
}
