import { execSync } from "child_process"
import fs from "fs"
import path from "path"

export default function main(): void {
	const packageJson = JSON.parse(
		fs.readFileSync(path.resolve(__dirname, `../package.json`)).toString(),
	)
	const distributionFilepaths: string[] =
		typeof packageJson === `object` &&
		packageJson !== null &&
		`files` in packageJson &&
		Array.isArray(packageJson.files) &&
		packageJson.files.every((filepath: unknown) => typeof filepath === `string`)
			? packageJson.files
			: []
	const tsconfigText = fs
		.readFileSync(path.resolve(__dirname, `../tsconfig.prod.json`))
		.toString()
	const tsconfigJson = JSON.parse(tsconfigText)
	console.log({ tsconfigJson })
	if (
		typeof tsconfigJson === `object` &&
		tsconfigJson !== null &&
		`include` in tsconfigJson
	) {
		console.log({ distributionFilepaths })
		const newTsconfigJson = { ...tsconfigJson }
		newTsconfigJson.include = [`__tests__`, ...distributionFilepaths]
		fs.writeFileSync(
			path.resolve(__dirname, `../tsconfig.prod.json`),
			JSON.stringify(newTsconfigJson, null, 2),
		)
	} else {
		throw new Error(
			`Expected tsconfig.prod.json to have an "include" property, but got ${tsconfigText}`,
		)
	}
	execSync(`biome format tsconfig.prod.json --write`)
}
