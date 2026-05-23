# replace playlist tracks

Source: docs/source/exhibits/core/advanced/join/replace-playlist-tracks.ts

```ts
import { editRelations } from "atom.io"

import { playlistTracks } from "./declare-playlist-tracks"

editRelations(playlistTracks, (relations) => {
	relations.replaceRelations(`playlist::road-trip`, [
		`track::dreams`,
		`track::landslide`,
		`track::rhiannon`,
	])
})
```
