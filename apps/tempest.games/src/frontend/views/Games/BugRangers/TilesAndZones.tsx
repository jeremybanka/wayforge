import { useJSON, useO } from "atom.io/react"
import { usePullMutable } from "atom.io/realtime-react"
import type { ReactNode } from "react"

import type { TileCoordinatesSerialized } from "../../../../library/bug-rangers-game-state"
import {
	gameTilesAtom,
	playableZonesAtom,
} from "../../../../library/bug-rangers-game-state"
import { GameTileActual, GameTilePreview } from "./HexTile"

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
	return tiles.map((coords) => (
		<GameTileActual
			key={coords}
			coordinatesSerialized={coords}
			isDeclarator={validWarDeclarators.includes(coords)}
			isTarget={validWarTargets.includes(coords)}
		/>
	))
}

export function PlayableZones(): ReactNode {
	const playableZones = useO(playableZonesAtom)
	return playableZones.map((coords) => (
		<GameTilePreview key={coords} coordinatesSerialized={coords} />
	))
}
