import type { AtomToken } from "atom.io"
import { atomFamily, getState } from "atom.io"
import { useO } from "atom.io/react"

export const findXCoordinateState = atomFamily<number, string>({
	key: `findXCoordinate`,
	default: 0,
})
export const findYCoordinateState = atomFamily<number, string>({
	key: `findYCoordinate`,
	default: 0,
})

const exampleXCoordinateState = findXCoordinateState(`example`)

getState(exampleXCoordinateState) // -> 0

export function Point(props: {
	xCoordinateState: AtomToken<number>
	yCoordinateState: AtomToken<number>
}): JSX.Element {
	const x = useO(props.xCoordinateState)
	const y = useO(props.yCoordinateState)

	return <div className="point" style={{ left: x, top: y }} />
}
