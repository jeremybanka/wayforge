import { setState } from "atom.io"
import { useJSON, useO } from "atom.io/react"
import { useRealtimeRooms } from "atom.io/realtime-react"
import type { ReactNode } from "react"

import {
	playerTurnSelector,
	turnInProgressAtom,
	turnNumberAtom,
} from "../../../../library/bug-rangers-game-state"
import type { GameProps } from "../../Game"

export function BugRangersUI({ userKey }: GameProps): ReactNode {
	const { myRoomKey, myMutualsAtom } = useRealtimeRooms(userKey)
	const myMutuals = useJSON(myMutualsAtom)
	const turnInProgress = useO(turnInProgressAtom)
	const turnNumber = useO(turnNumberAtom)
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
			<div>
				<div>turn: {turnNumber}</div>
				<div>players: {myMutuals.length}</div>
				{myMutuals.map((mutualUserKey) => {
					return <div key={mutualUserKey}>{mutualUserKey}</div>
				})}
			</div>
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
