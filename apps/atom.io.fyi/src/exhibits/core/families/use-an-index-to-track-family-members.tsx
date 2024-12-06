import { atom } from "atom.io"
import { findState } from "atom.io/ephemeral"
import { useO } from "atom.io/react"
import * as React from "react"

import { Point, xAtoms, yAtoms } from "./declare-a-family"

export const pointIndex = atom<string[]>({
	key: `pointIndex`,
	default: [],
})

export function AllPoints(): React.ReactNode {
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
