import { access, mkdir, readdir, rename, unlink } from "fs"
import { dirname } from "path"

import discoverSubmodules from "./__scripts__/discover-submodules.node"

function moveFile(oldPath, newPath) {
	// Check if the destination directory exists using fs.access
	access(dirname(newPath), (err) => {
		if (err) {
			// If the directory does not exist (error thrown), create it
			mkdir(dirname(newPath), { recursive: true }, (err) => {
				if (err) {
					console.error(`Error creating directory: ${err}`)
					return
				}
				// After creating the directory, move the file
				performFileMove(oldPath, newPath)
			})
		} else {
			// If no error, the directory exists, so move the file
			performFileMove(oldPath, newPath)
		}
	})
}

function performFileMove(oldPath, newPath) {
	rename(oldPath, newPath, (error) => {
		if (error) {
			console.error(`Error moving file (${oldPath} -> ${newPath}): ${error}`)
			return
		}
		console.log(`File moved from ${oldPath} to ${newPath}`)
	})
}

const submodules = discoverSubmodules()
console.log(submodules)

export const result = await Bun.build({
	target: `browser`,
	entrypoints: [
		`./src/index.ts`,
		...submodules.map((submodule) => `./${submodule}/src/index.ts`),
	],
	external: [
		`atom.io`,
		...submodules.map((submodule) => `atom.io/${submodule}`),
		`socket.io`,
		`socket.io-client`,
		`react`,
		`@types/react`,
		`@testing-library/react`,
		`@floating-ui/react`,
		`framer-motion`,
		`happy-dom`,
		`child_process`,
	],
	outdir: `./out`,
	splitting: true,
	sourcemap: `external`,
})
console.log(result)

async function findAndReplaceInFile(
	filePath: string,
	searchTerm: string,
	replacement: string,
) {
	try {
		// Step 1: Read the file content
		const originalFile = Bun.file(filePath)
		const originalContent = await originalFile.text()

		// Step 2: Replace the searchTerm with the replacement in the content
		const updatedContent = originalContent.replace(
			new RegExp(searchTerm, `g`),
			replacement,
		)

		// Step 3: Write the updated content back to the file
		await Bun.write(filePath, updatedContent)

		console.log(`Content updated successfully in "${filePath}"`)
	} catch (error) {
		console.error(`Error updating file "${filePath}":`, error)
	}
}

async function appendToFile(filePath: string, content: string) {
	try {
		// Step 1: Read the file content
		const originalFile = Bun.file(filePath)
		const originalContent = await originalFile.text()

		// Step 2: Append the content to the file
		const updatedContent = originalContent + `\n` + content + `\n`

		// Step 3: Write the updated content back to the file
		await Bun.write(filePath, updatedContent)

		console.log(`Content appended successfully to "${filePath}"`)
	} catch (error) {
		console.error(`Error appending to file "${filePath}":`, error)
	}
}

readdir(`./out`, async (err, files) => {
	if (err) {
		console.error(`Error reading directory: ${err}`)
		return
	}
	for (const file of files) {
		if (file.endsWith(`.js`)) {
			findAndReplaceInFile(`./out/${file}`, `../../chunk`, `../../dist/chunk`)
			appendToFile(`./out/${file}`, `//# sourceMappingURL=${file}.map`)
			moveFile(`./out/${file}`, `./dist/${file}`)
		}
		if (file.endsWith(`.map`)) {
			moveFile(`./out/${file}`, `./dist/${file}`)
		}
		if (file.endsWith(`.scss`)) {
			moveFile(`./out/${file}`, `./dist/${file}`)
		}
	}
	for (const submodule of submodules) {
		const distPath = `./out/${submodule}/src/index.js`
		const mapPath = `./out/${submodule}/src/index.js.map`
		await findAndReplaceInFile(distPath, `../../chunk`, `../../dist/chunk`)
		await appendToFile(distPath, `//# sourceMappingURL=index.js.map`)
		await findAndReplaceInFile(mapPath, `../${submodule}/src`, `../src`)
		moveFile(distPath, `./${submodule}/dist/index.js`)
		moveFile(mapPath, `./${submodule}/dist/index.js.map`)
	}
	const mainPath = `./out/src/index.js`
	await findAndReplaceInFile(mainPath, `../../chunk`, `../../dist/chunk`)
	await appendToFile(mainPath, `//# sourceMappingURL=index.js.map`)
	moveFile(mainPath, `./dist/index.js`)
	moveFile(mainPath + `.map`, `./dist/index.js.map`)
	// delete outdir
	unlink(`./out`, (err) => {
		if (err) {
			console.error(`Error deleting out directory: ${err}`)
			return
		}
		console.log(`Out directory deleted`)
	})
})

// console.log(result)

// for (const res of result.outputs) {
// 	console.log(res)
// 	// Can be consumed as blobs
// 	await res.text()

// 	// Bun will set Content-Type and Etag headers
// 	new Response(res)

// 	// Can be written manually, but you should use `outdir` in this case.
// 	// await res.writeFiles()
// }
