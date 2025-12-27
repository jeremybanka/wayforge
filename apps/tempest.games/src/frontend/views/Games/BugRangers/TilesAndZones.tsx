import { useJSON, useO } from "atom.io/react"
import { usePullMutable } from "atom.io/realtime-react"
import type { ReactNode } from "react"

import type { TileCoordinatesSerialized } from "../../../../library/bug-rangers-game-state"
import {
	gameTilesAtom,
	playableZonesAtom,
} from "../../../../library/bug-rangers-game-state"
import { GameTile } from "./HexTile"

export type GameTilesProps = {
	validWarDeclarators: readonly TileCoordinatesSerialized[]
	validWarTargets: readonly TileCoordinatesSerialized[]
}
export function GameTiles({
	validWarDeclarators,
	validWarTargets,
}: GameTilesProps): ReactNode {
	usePullMutable(gameTilesAtom)
	const tiles = useJSON(gameTilesAtom)
	return tiles.map((tileCoordinates) => (
		<GameTile
			key={tileCoordinates}
			coordinatesSerialized={tileCoordinates}
			isDeclarator={validWarDeclarators.includes(tileCoordinates)}
			isTarget={validWarTargets.includes(tileCoordinates)}
		/>
	))
}

export function PlayableZones(): ReactNode {
	const playableZones = useO(playableZonesAtom)
	return playableZones.map((coordinatesSerialized) => (
		<GameTile
			key={coordinatesSerialized}
			coordinatesSerialized={coordinatesSerialized}
			virtual
		/>
	))
}
