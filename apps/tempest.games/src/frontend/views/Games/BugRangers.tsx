import type { ReactElement } from "react"

import css from "./BugRangers.module.css"
import { BugRangers3D } from "./BugRangers/BugRangers3D"
import { BugRangersUI } from "./BugRangers/BugRangersUI"

export function BugRangers(): ReactElement {
	return (
		<bug-rangers className={css.class}>
			<BugRangers3D />
			<BugRangersUI />
		</bug-rangers>
	)
}
