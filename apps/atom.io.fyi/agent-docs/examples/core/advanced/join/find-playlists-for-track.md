# find playlists for track

Source: src/exhibits/core/advanced/join/find-playlists-for-track.ts

```ts
import { findRelations } from "atom.io"

import { playlistTracks } from "./declare-playlist-tracks"

const playlistsUsingDreamsState = findRelations(
	playlistTracks,
	`track::dreams`,
).playlistKeysOfTrack
```
