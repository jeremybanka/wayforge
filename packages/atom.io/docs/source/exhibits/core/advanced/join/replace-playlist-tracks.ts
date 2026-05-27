import { editRelations } from "atom.io"

import { playlistTracks } from "./declare-playlist-tracks"

editRelations(playlistTracks, (relations) => {
	relations.replaceRelations(`playlist::road-trip`, [
		`track::dreams`,
		`track::landslide`,
		`track::rhiannon`,
	])
})
