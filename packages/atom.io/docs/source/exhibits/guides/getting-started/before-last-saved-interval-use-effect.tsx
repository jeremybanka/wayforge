import * as React from "react"
import type { JSX } from "react/jsx-runtime"

const LAST_SAVED_AT = Date.now() - 12_000

export function LastSavedIndicator(): JSX.Element {
	const [now, setNow] = React.useState(Date.now())
	const seconds = Math.floor((now - LAST_SAVED_AT) / 1000)
	const label = seconds <= 0 ? `Saved just now` : `Saved ${seconds}s ago`

	React.useEffect(() => {
		const interval = window.setInterval(() => {
			setNow(Date.now())
		}, 1000)

		return () => {
			window.clearInterval(interval)
		}
	}, [])

	return <output>{label}</output>
}
