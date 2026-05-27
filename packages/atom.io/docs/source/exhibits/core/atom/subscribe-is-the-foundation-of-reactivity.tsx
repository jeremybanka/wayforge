import { useO } from "atom.io/react"

import { countAtom } from "./declare-an-atom"

function Component() {
	const count = useO(countAtom)
	return <>{count}</>
}
