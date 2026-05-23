import { atom } from "atom.io"
import { useO } from "atom.io/react"

import { Point, xAtoms, yAtoms } from "./declare-a-family"

export const pointKeysAtom = atom<string[]>({
	key: `pointKeys`,
	default: [],
})

function AllPoints() {
	const pointIds = useO(pointKeysAtom)
	return (
		<>
			{pointIds.map((pointId) => {
				return <Point key={pointId} pointId={pointId} />
			})}
		</>
	)
}
