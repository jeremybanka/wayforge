import * as fs from "node:fs"
import * as path from "node:path"

import { ATOM_IO_ROOT } from "./constants"

function replacePhraseInFile(
	filePath: string,
	oldPhrase: string,
	newPhrase: string,
): void {
	try {
		const data = fs.readFileSync(filePath, `utf8`)

		const result = data.replace(new RegExp(oldPhrase, `g`), newPhrase)

		fs.writeFileSync(filePath, result, `utf8`)

		console.log(
			`Replaced all instances of "${oldPhrase}" with "${newPhrase}" in file "${filePath}"`,
		)
	} catch (error) {
		console.error(`Error processing file "${filePath}":`, error)
	}
}

for (const filename of [`index.js`, `index.cjs`]) {
	const filePath = path.join(ATOM_IO_ROOT, `solid/dist`, filename)
	replacePhraseInFile(filePath, `solid-js/jsx-runtime`, `solid-js/h/jsx-runtime`)
}
