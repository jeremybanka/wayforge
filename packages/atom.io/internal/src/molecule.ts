import type { Canonical, stringified } from "atom.io/json"

export type Molecule<K extends Canonical> = {
	readonly key: K
	readonly stringKey: stringified<K>
	readonly dependsOn: `all` | `any`
}
