import * as fs from "node:fs"

const changesetFiles = fs.readdirSync(`${import.meta.dir}/.changesets`)
console.log({ changesetFiles })
for (const changesetFile of changesetFiles) {
	const changesetContent = fs.readFileSync(
		`${import.meta.dir}/.changesets/${changesetFile}`,
		`utf-8`,
	)
	console.log({ changesetContent })
	if (changesetContent.includes(`"my-library": major`)) {
		process.exit(0)
	}
}
process.exit(3)
