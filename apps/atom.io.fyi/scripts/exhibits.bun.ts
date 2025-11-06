#!/usr/bin/env bun

import fs from "node:fs"
import path from "node:path"

import chokidar from "chokidar"
import takua from "takua"

const myArgs = process.argv.slice(2)
const lastArgument = myArgs[myArgs.length - 1]
if (!lastArgument) {
	takua.error(`usage`, `No arguments provided: specify 'watch' or 'once'`)
	process.exit(1)
}

const inputDir = `./src/exhibits`
const outputDir = `./src/exhibits-wrapped`

function wrapCode(filename: string, code: string) {
	const wrappedCode = JSON.stringify(code)

	return [
		`import { CodeBlock } from "c/CodeBlock";`,
		`import type { VNode } from "preact";`,
		``,
		`export default (): VNode => <CodeBlock filepath="${filename}">`,
		`{/* eslint-disable-next-line quotes */}`,
		`{${wrappedCode}}`,
		`</CodeBlock>`,
	].join(`\n`)
}

function handleFile(filePath: string) {
	const code = fs.readFileSync(filePath, `utf8`)
	const directory = path.dirname(filePath)
	const relativeDirectory = path.relative(inputDir, directory)
	const filename = path.basename(filePath)
	const filenameWithoutExtension = filename.split(`.`)[0]
	const outputFilename = `${filenameWithoutExtension}.gen.tsx`
	const outputFilePath = path.resolve(
		outputDir,
		relativeDirectory,
		outputFilename,
	)
	const wrappedCode = wrapCode(filename, code)
	try {
		takua.info(`writing`, outputFilePath)
		fs.writeFileSync(outputFilePath, wrappedCode)
	} catch (thrown) {
		if (thrown instanceof Error) {
			takua.info(`directory`, path.dirname(outputFilePath))
			fs.mkdirSync(path.dirname(outputFilePath), { recursive: true })
			fs.writeFileSync(outputFilePath, wrappedCode)
		} else {
			throw thrown
		}
	}
}

switch (lastArgument) {
	// biome-ignore lint/suspicious/noFallthroughSwitchClause: good use case for fallthrough
	case `watch`: {
		takua.info(`watch`, inputDir)
		const watcher = chokidar.watch(inputDir, { persistent: true })

		watcher.on(`add`, (filePath) => {
			takua.info(`add`, filePath)
			handleFile(filePath)
		})
		watcher.on(`change`, (filePath) => {
			takua.info(`change`, filePath)
			handleFile(filePath)
		})
	}
	case `once`: {
		takua.info(`build`, inputDir)
		function buildAll(directory = inputDir) {
			fs.readdir(directory, (err, files) => {
				if (err) {
					takua.error(`reading`, directory, err)
					return
				}
				takua.info(`found`, `files`, files)

				for (const file of files) {
					const filePath = path.join(directory, file)
					fs.stat(filePath, (error, stats) => {
						if (error) {
							takua.error(`building`, filePath, error)
						}
						if (stats.isFile()) {
							handleFile(filePath)
						} else if (stats.isDirectory()) {
							buildAll(filePath)
						}
					})
				}
			})
		}
		buildAll()
		break
	}
	default:
		throw new Error(
			`Unknown argument "${lastArgument}"; expected "watch" or "once"`,
		)
}
