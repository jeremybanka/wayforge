async function gen() {
	const htmxMinJs = await Bun.file(
		`node_modules/htmx.org/dist/htmx.min.js`,
	).text()
	// const hyperScriptMinJS = await Bun.file(
	// 	`./node_modules/hyperscript.org/dist/_hyperscript.min.js`,
	// ).text()
	await Bun.write(
		`./src/scripts.gen.ts`,
		`/* eslint-disable */\nexport const htmxMinJS = ${JSON.stringify(
			JSON.stringify(htmxMinJs),
		)};\n`,
		// export const hyperScriptMinJS = ${JSON.stringify(
		// 	JSON.stringify(hyperScriptMinJS),
		// )};\n`,
	)
}

void gen()
