import { useTL } from "atom.io/react"
import { coordinatesTL } from "../core/timeline/create-a-timeline"

export const UrlDisplay: React.FC = () => {
	const { at, length, undo, redo } = useTL(coordinatesTL)
	return (
		<>
			<div>{at}</div>
			<div>{length}</div>
			<button type="button" onClick={undo}>
				undo
			</button>
			<button type="button" onClick={redo}>
				redo
			</button>
		</>
	)
}
