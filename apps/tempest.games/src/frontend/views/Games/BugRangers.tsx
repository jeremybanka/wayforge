import type { Children } from "@atom.io/spa"

import css from "./BugRangers.module.css"
import { BugRangers3D } from "./BugRangers/BugRangers3D"
import { BugRangersUI } from "./BugRangers/BugRangersUI"

export function BugRangers(): Children {
	return (
		<bug-rangers className={css.class}>
			<BugRangers3D />
			<BugRangersUI />
		</bug-rangers>
	)
}
