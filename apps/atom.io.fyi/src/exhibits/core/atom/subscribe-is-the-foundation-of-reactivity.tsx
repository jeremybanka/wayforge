import { useO } from "atom.io/react"
import { countState } from "./declare-an-atom"

export default function Component(): JSX.Element {
	const count = useO(countState)
	return <>{count}</>
}
