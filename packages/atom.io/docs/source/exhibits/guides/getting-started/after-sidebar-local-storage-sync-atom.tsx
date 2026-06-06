import { atom } from "atom.io"
import { useI, useO } from "atom.io/react"
import { storageSync } from "atom.io/web"
import type { JSX } from "react/jsx-runtime"

const SIDEBAR_STORAGE_KEY = `sidebarCollapsed`

const sidebarCollapsedAtom = atom<boolean>({
	key: `sidebarCollapsed`,
	default: false,
	effects: [storageSync(localStorage, JSON, SIDEBAR_STORAGE_KEY)],
})

export function SidebarLocalStoragePreference(): JSX.Element {
	const collapsed = useO(sidebarCollapsedAtom)
	const setCollapsed = useI(sidebarCollapsedAtom)

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
