import { useO } from "atom.io/react"
import type { UserKey } from "atom.io/realtime"
import * as React from "react"

import { Hand } from "../game-pieces/Hand"
import { handsOfPlayerSelectors } from "../hearts-client-store/player-hand"
import scss from "./TheirHands.module.scss"

export const TheirHands: React.FC<{ userKey: UserKey }> = ({ userKey }) => {
	const theirHands = useO(handsOfPlayerSelectors, userKey)
	return (
		<div className={scss[`class`]}>
			{theirHands.map((id) => (
				<Hand key={id} />
			))}
		</div>
	)
}
