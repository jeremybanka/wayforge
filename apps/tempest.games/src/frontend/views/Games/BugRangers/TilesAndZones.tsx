import type { Children } from "@atom.io/spa"

import {
	gameTilesAtom,
	playableZonesSelector,
} from "../../../../library/bug-rangers-game-state"
import {
	usePullMutable,
	usePullSelector,
} from "../../../services/realtime-hooks"
import { useMutable } from "../../../services/spa-state"
import { GameTileActual, GameTilePreview } from "./HexTile"

export function GameTiles(): Children {
	usePullMutable(gameTilesAtom)
	const tiles = useMutable(gameTilesAtom)
	return (
		<>
			{tiles().map((coords) => (
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
