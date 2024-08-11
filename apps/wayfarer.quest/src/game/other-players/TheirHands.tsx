import { useO } from "atom.io/react"
import * as React from "react"
import { handsOfPlayerSelectors } from "wayfarer.quest/services/store/player-hand"

import { Hand } from "../game-pieces/Hand"
import scss from "./TheirHands.module.scss"

export const TheirHands: React.FC<{ playerId: string }> = ({ playerId }) => {
	const theirHands = useO(handsOfPlayerSelectors, playerId)

	return (
		<div className={scss.class}>
			{theirHands.map((id) => (
				<Hand key={id} id={id} />
			))}
		</div>
	)
}
