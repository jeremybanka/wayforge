import type { ReactElement } from "react"

import type { GameProps } from "../Game"
import { BugRangers3D } from "./BugRangers/BugRangers3D"
import { BugRangersUI } from "./BugRangers/BugRangersUI"

export function BugRangers(props: GameProps): ReactElement {
	return (
		<>
			<BugRangers3D />
			<BugRangersUI {...props} />
		</>
	)
}
