import type { ReactElement } from "react"

import { BugRangers3D } from "./BugRangers/BugRangers3D"
import { BugRangersUI } from "./BugRangers/BugRangersUI"

export function BugRangers(): ReactElement {
	return (
		<>
			<BugRangers3D />
			<BugRangersUI />
		</>
	)
}
