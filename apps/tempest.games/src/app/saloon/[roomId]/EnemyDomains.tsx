import { useO } from "atom.io/react"
import * as React from "react"

import { ownersOfGroups } from "~/apps/node/lodge/src/store/game"

import { usePullMutableFamilyMember } from "atom.io/realtime-react"
import { otherPlayersIndex } from "src/services/store/enemy-hands-index"
import { findHandsOfPlayer } from "src/services/store/player-hand"
import { Hand } from "./Hand"

import scss from "./EnemyDomains.module.scss"

export const TheirHands: React.FC<{ playerId: string }> = ({ playerId }) => {
	const theirHands = useO(findHandsOfPlayer(playerId))
	usePullMutableFamilyMember(ownersOfGroups.core.findRelatedKeysState(playerId))

	console.log({ theirHands })
	return (
		<div className="their-hands">
			{theirHands.map((id) => (
				<Hand key={id} id={id} />
			))}
		</div>
	)
}

export const EnemyDomains: React.FC = () => {
	const enemyIds = useO(otherPlayersIndex)
	console.log({ enemyIds })
	return (
		<div className={scss.class}>
			{enemyIds.map((id) => (
				<div key={id} className="enemy">
					<TheirHands playerId={id} />
				</div>
			))}
		</div>
	)
}
