import { findRelations } from "atom.io"

import { playlistTracks } from "./declare-playlist-tracks"

const playlistsUsingDreamsState = findRelations(
	playlistTracks,
	`track::dreams`,
).playlistKeysOfTrack
