import type { AtomToken } from "atom.io"
import { atomFamily, getState } from "atom.io"
import { useO } from "atom.io/react"

export const findXState = atomFamily<number, string>({
	key: `x`,
	default: 0,
})
export const findYState = atomFamily<number, string>({
	key: `y`,
	default: 0,
})

const exampleXState = findXState(`example`)

getState(exampleXState) // -> 0

export function Point(props: {
	xState: AtomToken<number>
	yState: AtomToken<number>
}): JSX.Element {
	const x = useO(props.xState)
	const y = useO(props.yState)

	return <div className="point" style={{ left: x, top: y }} />
}
