async function gen() {
	const htmxMinJS = await Bun.file(
		`./node_modules/htmx.org/dist/htmx.min.js`,
	).text()
	// const hyperScriptMinJS = await Bun.file(
	// 	`./node_modules/hyperscript.org/dist/_hyperscript.min.js`,
	// ).text()
	Bun.write(
		`./src/scripts.gen.ts`,
		`/* eslint-disable */\nexport const htmxMinJS = ${JSON.stringify(
			JSON.stringify(htmxMinJS),
		)};\n`,
		// export const hyperScriptMinJS = ${JSON.stringify(
		// 	JSON.stringify(hyperScriptMinJS),
		// )};\n`,
	)
}

gen()
