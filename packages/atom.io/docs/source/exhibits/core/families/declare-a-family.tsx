import { atomFamily, getState } from "atom.io"
import { useO } from "atom.io/react"
import * as React from "react"

export const xAtoms = atomFamily<number, string>({
	key: `x`,
	default: 0,
})
export const yAtoms = atomFamily<number, string>({
	key: `y`,
	default: 0,
})

getState(xAtoms, `example`) // -> 0

export function Point(props: { pointId: string }): React.JSX.Element {
	const x = useO(xAtoms, props.pointId)
	const y = useO(yAtoms, props.pointId)

	return <div className="point" style={{ left: x, top: y }} />
}
