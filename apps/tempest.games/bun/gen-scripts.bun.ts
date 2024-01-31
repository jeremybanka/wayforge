import * as fs from "fs"

function gen() {
	const htmxMinJS = fs.readFileSync(
		`./node_modules/htmx.org/dist/htmx.min.js`,
		`utf-8`,
	)
	const hyperScriptMinJS = fs.readFileSync(
		`./node_modules/hyperscript.org/dist/_hyperscript.min.js`,
		`utf-8`,
	)
	fs.writeFileSync(
		`./src/scripts.gen.ts`,
		`/* eslint-disable */\nexport const htmxMinJS = ${JSON.stringify(
			JSON.stringify(htmxMinJS),
		)};\nexport const hyperScriptMinJS = ${JSON.stringify(
			JSON.stringify(hyperScriptMinJS),
		)};`,
	)
}

gen()
