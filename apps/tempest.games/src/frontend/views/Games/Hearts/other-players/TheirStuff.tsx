import * as React from "react"

import { TheirHands } from "./TheirHands"

export const TheirStuff: React.FC<{ playerId: string }> = ({ playerId }) => {
	return <TheirHands playerId={playerId} />
}
