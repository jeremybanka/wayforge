import { useJSON, useO } from "atom.io/react"
import type { ReactNode } from "react"

import { GameTile } from "./HexTile"
import { gameTilesAtom, playableZonesAtom } from "./bug-rangers-client-state"

export function GameTiles(): ReactNode {
	const tiles = useJSON(gameTilesAtom)
	return tiles.map((tileCoordinates, idx) => (
		<GameTile key={idx} coordinatesSerialized={tileCoordinates} color={`#aa5`} />
	))
}

export function PlayableZones(): ReactNode {
	const playableZones = useO(playableZonesAtom)
	return playableZones.map((coordinatesSerialized, idx) => (
		<GameTile
			key={idx}
			coordinatesSerialized={coordinatesSerialized}
			color={`#0ff`}
			virtual
		/>
	))
}
