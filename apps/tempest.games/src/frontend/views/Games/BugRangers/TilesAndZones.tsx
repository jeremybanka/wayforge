import type { Children } from "@atom.io/spa"

import {
	gameTilesAtom,
	playableZonesSelector,
} from "../../../../library/bug-rangers-game-state"
import {
	usePullMutable,
	usePullSelector,
} from "../../../services/realtime-hooks"
import { GameTileActual, GameTilePreview } from "./HexTile"

export function GameTiles(): Children {
	const tiles = usePullMutable(gameTilesAtom)
	return (
		<>
			{Array.from(tiles()).map((coords) => (
				<GameTileActual key={coords} coordinatesSerialized={coords} />
			))}
		</>
	)
}

export function PlayableZones(): Children {
	const playableZones = usePullSelector(playableZonesSelector)
	return (
		<>
			{playableZones().map((coords) => (
				<GameTilePreview key={coords} coordinatesSerialized={coords} />
			))}
		</>
	)
}
