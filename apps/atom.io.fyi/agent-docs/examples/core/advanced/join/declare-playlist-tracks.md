# declare playlist tracks

Source: src/exhibits/core/advanced/join/declare-playlist-tracks.ts

```ts
import { join } from "atom.io"

type PlaylistKey = `playlist::${string}`
type TrackKey = `track::${string}`

export const playlistTracks = join({
	key: `playlistTracks`,
	between: [`playlist`, `track`],
	cardinality: `n:n`,
	isAType: (input): input is PlaylistKey => input.startsWith(`playlist::`),
	isBType: (input): input is TrackKey => input.startsWith(`track::`),
})
```
