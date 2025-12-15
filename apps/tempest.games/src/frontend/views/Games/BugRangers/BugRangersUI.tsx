import { useSpring } from "@react-spring/three"
import { setState } from "atom.io"
import { useO } from "atom.io/react"
import { useRealtimeRooms } from "atom.io/realtime-react"
import type { ReactNode } from "react"

import {
	playerTurnSelector,
	turnInProgressAtom,
} from "../../../../library/bug-rangers-game-state"
import type { GameProps } from "../../Game"
import { cameraTargetAtom } from "../BugRangers/bug-rangers-client-state"

export function BugRangersUI({ userKey }: GameProps): ReactNode {
	const cameraTarget = useO(cameraTargetAtom)
	useSpring({
		animatedCam: cameraTarget,
		config: { mass: 1, tension: 170, friction: 26 },
	})
	const { currentRoom } = useRealtimeRooms(userKey)
	const turnInProgress = useO(turnInProgressAtom)
	const playerTurn = useO(playerTurnSelector)

	return (
		<div
			style={{
				position: `fixed`,
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				pointerEvents: `none`,
				display: `flex`,
				flexDirection: `column`,
				alignItems: `center`,
				justifyContent: `space-around`,
			}}
		>
			<div>{playerTurn}</div>
			<button
				type="button"
				disabled={!turnInProgress}
				style={{ pointerEvents: `all` }}
				onClick={() => {
					setState(turnInProgressAtom, null)
				}}
			>
				end turn
			</button>
		</div>
	)
}
