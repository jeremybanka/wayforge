import path from "node:path"

import { directory, run } from "../fixtures/completion-cobra"

for (const command of [`__complete`, `__completeNoDesc`]) {
	test.each([
		[`enum`, [`--state`, `cl`]],
		[`inline value`, [`--state=cl`]],
		[`descriptions`, [`--base`, `ma`]],
		[`no space`, [`--token`, `pref`]],
		[`files`, [`--input`, ``]],
		[`directories`, [`--directory`, ``]],
	] satisfies [string, string[]][])(
		`${command}: %s matches upstream`,
		(_name, words) => {
			const actual = run(`node`, [
				path.join(directory, `cli.js`),
				command,
				`pr`,
				`list`,
				...words,
			])
			expect(actual).toBe(
				run(path.join(directory, `cobra-oracle`), [command, ...words]),
			)
		},
		30_000,
	)
}

// Opt in when investigating consumer upgrades; an upstream limitation is not a
// required behavior of comline. Normal protocol tests above require no Carapace.
