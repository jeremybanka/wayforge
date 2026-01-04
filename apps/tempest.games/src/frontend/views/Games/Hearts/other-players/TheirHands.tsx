import { useO } from "atom.io/react"
import * as React from "react"

import { Hand } from "../game-pieces/Hand"
import { handsOfPlayerSelectors } from "../hearts-client-store/player-hand"
import scss from "./TheirHands.module.scss"

export const TheirHands: React.FC<{ playerId: string }> = ({ playerId }) => {
	const theirHands = useO(handsOfPlayerSelectors, playerId)

	return (
		<div className={scss[`class`]}>
			{theirHands.map((id) => (
				<Hand key={id} id={id} />
			))}
		</div>
	)
}
