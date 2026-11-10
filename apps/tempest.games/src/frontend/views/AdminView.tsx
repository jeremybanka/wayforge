import type { Children } from "@atom.io/spa"

import css from "./AdminView.module.css"

export function AdminView(): Children {
	return (
		<admin-view className={css.class}>
			<h1>admin</h1>
		</admin-view>
	)
}
