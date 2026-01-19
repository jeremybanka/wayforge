import { useJSON } from "atom.io/react"
import { usePullMutable, usePullSelector } from "atom.io/realtime-react"
import type { ReactNode } from "react"

import type { TileCoordinatesSerialized } from "../../../../library/game-systems/bug-rangers-game-state"
import {
	gameTilesAtom,
	playableZonesSelector,
} from "../../../../library/game-systems/bug-rangers-game-state"
import { GameTileActual, GameTilePreview } from "./HexTile"

export type GameTilesProps = {
	validWarDeclarators: readonly TileCoordinatesSerialized[]
	validWarTargets: readonly TileCoordinatesSerialized[]
}
export function GameTiles(): ReactNode {
	usePullMutable(gameTilesAtom)
	const tiles = useJSON(gameTilesAtom)
	return tiles.map((coords) => (
		<GameTileActual key={coords} coordinatesSerialized={coords} />
	))
}

export function PlayableZones(): ReactNode {
	const playableZones = usePullSelector(playableZonesSelector)
	return playableZones.map((coords) => (
		<GameTilePreview key={coords} coordinatesSerialized={coords} />
	))
}
