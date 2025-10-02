import { useO } from "atom.io/react"
import * as React from "react"

import { countState } from "./declare-an-atom"

export default function Component(): React.ReactNode {
	const count = useO(countState)
	return <>{count}</>
}
