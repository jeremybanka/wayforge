import { css } from "@emotion/react"
import { useO } from "atom.io/react"
import * as React from "react"

import { Hand } from "./Hand"
import { otherPlayersIndex } from "./store/enemy-hands-index"
import { findHandsOfPlayer } from "./store/player-hand"

export const TheirHands: React.FC<{ playerId: string }> = ({ playerId }) => {
	const theirHands = useO(findHandsOfPlayer(playerId))
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
	return (
		<div
			className="enemy-domains"
			css={css`
        width: 100%;
        display: flex;
        flex-flow: row nowrap;
        > * ~ * {
          margin-left: 10px;
        }
      `}
		>
			{enemyIds.map((id) => (
				<div key={id} className="enemy">
					<TheirHands playerId={id} />
				</div>
			))}
		</div>
	)
}
