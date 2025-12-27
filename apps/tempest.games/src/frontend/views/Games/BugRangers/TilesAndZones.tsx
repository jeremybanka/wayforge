import { useJSON, useO } from "atom.io/react"
import type { ReactNode } from "react"

import {
	gameTilesAtom,
	playableZonesAtom,
} from "../../../../library/bug-rangers-game-state"
import { GameTile } from "./HexTile"

export function GameTiles(): ReactNode {
	const tiles = useJSON(gameTilesAtom)
	return tiles.map((tileCoordinates, idx) => (
		<GameTile key={idx} coordinatesSerialized={tileCoordinates} color={`#aa5`} />
	))
}

export function PlayableZones(): ReactNode {
	const playableZones = useO(playableZonesAtom)
	return playableZones.map((coordinatesSerialized) => (
		<GameTile
			key={coordinatesSerialized}
			coordinatesSerialized={coordinatesSerialized}
			color={`#0ff`}
			virtual
		/>
	))
}
