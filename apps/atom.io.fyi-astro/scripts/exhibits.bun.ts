#!/usr/bin/env bun

import fs from "node:fs"
import path from "node:path"

import chokidar from "chokidar"
import npmlog from "npmlog"

const myArgs = process.argv.slice(2)
const lastArgument = myArgs[myArgs.length - 1]
if (!lastArgument) {
	npmlog.error(`usage`, `No arguments provided: specify 'watch' or 'once'`)
	process.exit(1)
}

const inputDir = `./src/exhibits`
const outputDir = `./src/exhibits-wrapped`

function wrapCode(filename: string, code: string) {
	return `/* eslint-disable quotes */
import * as React from 'react';
import type { VNode } from 'preact';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

const Codeblock = (): VNode => {
	const myRef = React.useRef<HTMLSpanElement>(null);
	React.useEffect(() => {
		const me = myRef.current;
		if (me === null) {
			return;
		}
		const myElementsWithClassNameStringAndContainingDoubleQuotes = 
			Array.prototype.filter.call(
				me.querySelectorAll('.token.string'),
				(element: any) => element.textContent.includes('./')
			);
		for (const element of myElementsWithClassNameStringAndContainingDoubleQuotes) {
			// get everything following the final '/'
			const href = "#" + element.textContent.split('/').pop();
			element.innerHTML = \`<a href="\${href}">\${element.textContent}</a>\`;
		}
	}, [myRef.current]);
	return (
		<span className="codeblock" id="${filename.split(`.`)[0]}" ref={myRef}>
			<header>${filename}</header>
			<SyntaxHighlighter language="tsx" useInlineStyles={false}>
				{${JSON.stringify(code)}}
			</SyntaxHighlighter>
		</span>
	);
};

export default Codeblock;
`
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
		npmlog.info(`writing`, outputFilePath)
		fs.writeFileSync(outputFilePath, wrappedCode)
	} catch (thrown) {
		if (thrown instanceof Error) {
			npmlog.info(`directory`, path.dirname(outputFilePath))
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
		npmlog.info(`watch`, inputDir)
		const watcher = chokidar.watch(inputDir, { persistent: true })

		watcher.on(`add`, (filePath) => {
			npmlog.info(`add`, filePath)
			handleFile(filePath)
		})
		watcher.on(`change`, (filePath) => {
			npmlog.info(`change`, filePath)
			handleFile(filePath)
		})
	}
	case `once`: {
		npmlog.info(`build`, inputDir)
		function buildAll(directory = inputDir) {
			fs.readdir(directory, (err, files) => {
				if (err) {
					npmlog.error(`reading`, directory, err)
					return
				}
				npmlog.info(`found`, `files`, files)

				for (const file of files) {
					const filePath = path.join(directory, file)
					fs.stat(filePath, (error, stats) => {
						if (error) {
							npmlog.error(`building`, filePath, error)
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
