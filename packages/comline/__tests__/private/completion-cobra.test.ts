import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"

import { directory, run } from "../fixtures/completion-cobra"

// Opt in when investigating consumer upgrades; an upstream limitation is not a
// required behavior of comline. The public protocol suite requires no Carapace.
test.runIf(process.env[`COMLINE_PROBE_CARAPACE_COBRA`] === `1`)(
	`Carapace's Cobra bridge drops inline values for both implementations`,
	() => {
		run(`bun`, [
			`build`,
			path.join(import.meta.dirname, `../fixtures/completion.x.ts`),
			`--compile`,
			`--outfile=${directory}/cli`,
		])
		const specs = path.join(directory, `config/carapace/specs`)
		mkdirSync(specs, { recursive: true })
		for (const [name, executable] of [
			[`upstream`, `cobra-oracle`],
			[`comline`, `cli`],
		]) {
			writeFileSync(
				path.join(specs, `${name}.yaml`),
				`name: ${name}\nparsing: disabled\ncompletion:\n  positionalany: ['$carapace.bridge.Cobra(["${path.join(directory, executable)}"])']\n`,
			)
		}
		const upstream = JSON.parse(
			run(`carapace`, [`upstream`, `nushell`, `upstream`, `--state=cl`]),
		)
		const actual = JSON.parse(
			run(`carapace`, [
				`comline`,
				`nushell`,
				`comline`,
				`pr`,
				`list`,
				`--state=cl`,
			]),
		)
		expect(actual).toEqual(upstream)
		expect(actual).toEqual([])
	},
	30_000,
)
