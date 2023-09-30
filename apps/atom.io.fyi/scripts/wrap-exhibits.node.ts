import fs from "fs"
import path from "path"

import chokidar from "chokidar"
import npmlog from "npmlog"

const myArgs = process.argv.slice(2)
const lastArgument = myArgs[myArgs.length - 1]
if (lastArgument == null) {
	npmlog.error(
		`wrap-exhibits`,
		`No arguments provided: specify 'watch' or 'all'`,
	)
	process.exit(1)
}

const inputDir = `./src/exhibits`
const outputDir = `./src/exhibits-wrapped`

// Function to wrap the TSX code in a function component
function wrapCode(filename: string, code: string) {
	return `'use client'
{/* eslint-disable quotes */}
import * as React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

const Codeblock: React.FC = () => {
	const myRef = React.useRef<HTMLSpanElement>(null);
	React.useEffect(() => {
		const me = myRef.current;
		if (me === null) {
			return;
		}
		const myElementsWithClassNameStringAndContainingDoubleQuotes = 
			Array.prototype.filter.call(
				me.querySelectorAll('.token.string'),
				(element) => element.textContent.includes('"./')
			);
		for (const element of myElementsWithClassNameStringAndContainingDoubleQuotes) {
			const href = "#" + element.textContent.replace(/["./]/g, '');
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

// Function to handle a file being added or changed
function handleFile(filePath: string) {
	npmlog.info(`wrap-exhibits`, `Handling file ${filePath}`)
	const code = fs.readFileSync(filePath, `utf8`)
	const fileName = path.basename(filePath)
	const fileNameWithoutExtension = fileName.split(`.`)[0]
	const outputFilename = `${fileNameWithoutExtension}.gen.tsx`
	const outputFilePath = path.resolve(outputDir, outputFilename)
	const wrappedCode = wrapCode(fileName, code)
	fs.writeFileSync(outputFilePath, wrappedCode)
}

if (lastArgument === `watch`) {
	npmlog.info(`wrap-exhibits`, `Watching ${inputDir} for changes...`)
	const watcher = chokidar.watch(inputDir, { persistent: true })

	watcher.on(`add`, (filePath) => {
		npmlog.info(`ADD`, `Handling add event for ${filePath}`)
		handleFile(filePath)
	})
	watcher.on(`change`, (filePath) => {
		npmlog.info(`CHANGE`, `Handling add event for ${filePath}`)
		handleFile(filePath)
	})
} else {
	npmlog.info(`wrap-exhibits`, `Processing all files in ${inputDir}...`)
	fs.readdir(inputDir, (err, files) => {
		if (err) {
			return console.log(`Unable to scan directory: ` + err)
		}

		files.forEach((file) => {
			const filePath = path.join(inputDir, file)

			// Check if the path is a file
			fs.stat(filePath, (err, stats) => {
				if (err) {
					return console.log(`Unable to retrieve file stats: ${err}`)
				}

				if (stats.isFile()) {
					handleFile(filePath)
				}
			})
		})
	})
}
