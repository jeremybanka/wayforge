import { atom } from "atom.io"
import { useO } from "atom.io/react"
import {
	Point,
	findXCoordinateState,
	findYCoordinateState,
} from "./declare-a-family"

export const pointIndex = atom<string[]>({
	key: `pointIndex`,
	default: [],
})

export function AllPoints(): JSX.Element {
	const pointIds = useO(pointIndex)
	const xCoordinateState = findXCoordinateState(`example`)
	const yCoordinateState = findYCoordinateState(`example`)

	return (
		<>
			{pointIds.map((pointId) => (
				<Point
					key={pointId}
					xCoordinateState={xCoordinateState}
					yCoordinateState={yCoordinateState}
				/>
			))}
		</>
	)
}
