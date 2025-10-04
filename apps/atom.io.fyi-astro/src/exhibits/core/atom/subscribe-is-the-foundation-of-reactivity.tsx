import { useO } from "atom.io/react"

import { countState } from "./declare-an-atom"

function Component() {
	const count = useO(countState)
	return <>{count}</>
}
