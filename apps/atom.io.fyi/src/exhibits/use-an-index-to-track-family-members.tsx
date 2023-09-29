import { atom } from "atom.io"
import { useO } from "atom.io/react"
import { Point, findXState, findYState } from "./declare-a-family"

export const pointIndex = atom<string[]>({
	key: `pointIndex`,
	default: [],
})

export function AllPoints(): JSX.Element {
	const pointIds = useO(pointIndex)
	return (
		<>
			{pointIds.map((pointId) => {
				const xState = findXState(pointId)
				const yState = findYState(pointId)
				return <Point key={pointId} xState={xState} yState={yState} />
			})}
		</>
	)
}
