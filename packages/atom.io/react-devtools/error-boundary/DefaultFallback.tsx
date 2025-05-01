import type { ErrorInfo, FC } from "react"

export type FallbackProps = {
	error?: Error | string | undefined
	errorInfo?: ErrorInfo | undefined
}

export const DefaultFallback: FC<FallbackProps> = ({ error, errorInfo }) => {
	const component = errorInfo?.componentStack?.split(` `).filter(Boolean)[2]
	const message =
		error?.toString() ?? errorInfo?.componentStack ?? `Unknown error`
	return (
		<div
			data-testid="error-boundary"
			style={{
				flex: `1`,
				background: `black`,
				backgroundImage: `url(./src/assets/kablooey.gif)`,
				backgroundPosition: `center`,
				// backgroundRepeat: `no-repeat`,
				backgroundSize: `overlay`,
			}}
		>
			{/* <img src="./src/assets/kablooey.gif" alt="error" /> */}
			<div
				style={{
					margin: `50px`,
					marginTop: `0`,
					padding: `50px`,
					border: `1px solid dashed`,
				}}
			>
				<span
					style={{
						background: `black`,
						color: `white`,
						padding: 10,
						paddingTop: 5,
					}}
				>
					{`⚠️ `}
					<span style={{ color: `#fc0`, fontWeight: 700 }}>{component}</span>
					{` ⚠️ `}
					{message}
				</span>
			</div>
		</div>
	)
}
