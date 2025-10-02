import { atom, findState } from "atom.io"
import { useO } from "atom.io/react"

import { Point, xAtoms, yAtoms } from "./declare-a-family"

export const pointIndex = atom<string[]>({
	key: `pointIndex`,
	default: [],
})

function AllPoints() {
	const pointIds = useO(pointIndex)
	return (
		<>
			{pointIds.map((pointId) => {
				const xAtom = findState(xAtoms, pointId)
				const yAtom = findState(yAtoms, pointId)
				return <Point key={pointId} xState={xAtom} yState={yAtom} />
			})}
		</>
	)
}
