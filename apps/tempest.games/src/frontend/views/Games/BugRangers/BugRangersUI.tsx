import { setState } from "atom.io"
import { useJSON, useO } from "atom.io/react"
import type { UserKey } from "atom.io/realtime"
import {
	usePullAtomFamilyMember,
	useRealtimeRooms,
} from "atom.io/realtime-react"
import type { ReactElement, ReactNode } from "react"

import {
	playerTurnSelector,
	turnInProgressAtom,
	turnNumberAtom,
} from "../../../../library/bug-rangers-game-state"
import { usernameAtoms } from "../../../../library/username-state"
import type { GameProps } from "../../Game"
import scss from "./BugRangersUI.module.scss"

export function BugRangersUI({ userKey }: GameProps): ReactNode {
	const { myRoomKey, myMutualsAtom } = useRealtimeRooms(userKey)
	const myMutuals = useJSON(myMutualsAtom)
	const turnInProgress = useO(turnInProgressAtom)
	const turnNumber = useO(turnNumberAtom)
	const playerTurn = useO(playerTurnSelector)

	return (
		<main className={scss[`class`]}>
			<article data-css="room-module">
				<header>
					<h1>{myRoomKey}</h1>
					<span>Turn {turnNumber}</span>
				</header>
				<main>
					{myMutuals.map((mutualUserKey) => {
						return <Mutual key={mutualUserKey} mutualUserKey={mutualUserKey} />
					})}
				</main>
			</article>
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
		</main>
	)
}

export function Mutual({
	mutualUserKey,
}: {
	mutualUserKey: UserKey
}): ReactElement {
	const username = usePullAtomFamilyMember(usernameAtoms, mutualUserKey)
	return <div data-css="mutual">{username.slice(0, 1)}</div>
}
