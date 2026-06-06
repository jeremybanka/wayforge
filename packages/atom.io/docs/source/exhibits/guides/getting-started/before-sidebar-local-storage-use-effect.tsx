import * as React from "react"
import type { JSX } from "react/jsx-runtime"

const SIDEBAR_STORAGE_KEY = `sidebarCollapsed`

export function SidebarLocalStoragePreference(): JSX.Element {
	const [collapsed, setCollapsed] = React.useState(
		() => localStorage.getItem(SIDEBAR_STORAGE_KEY) === `true`,
	)

	React.useEffect(() => {
		localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed))
	}, [collapsed])

	return (
		<label>
			<input
				type="checkbox"
				checked={collapsed}
				onChange={(event) => {
					setCollapsed(event.currentTarget.checked)
				}}
			/>
			Collapse sidebar
		</label>
	)
}
