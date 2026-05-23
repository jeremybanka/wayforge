# find tracks in playlist

Source: docs/source/exhibits/core/advanced/join/find-tracks-in-playlist.ts

```ts
import { findRelations } from "atom.io"

import { playlistTracks } from "./declare-playlist-tracks"

const tracksInRoadTripState = findRelations(
	playlistTracks,
	`playlist::road-trip`,
).trackKeysOfPlaylist
```
