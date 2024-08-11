import type { RegularAtomToken } from "atom.io"
import { atomFamily, getState } from "atom.io"
import { useO } from "atom.io/react"

export const xAtoms = atomFamily<number, string>({
	key: `x`,
	default: 0,
})
export const yAtoms = atomFamily<number, string>({
	key: `y`,
	default: 0,
})

getState(xAtoms, `example`) // -> 0

export function Point(props: {
	xState: RegularAtomToken<number>
	yState: RegularAtomToken<number>
}): JSX.Element {
	const x = useO(props.xState)
	const y = useO(props.yState)

	return <div className="point" style={{ left: x, top: y }} />
}
