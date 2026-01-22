#!/usr/bin/env node

import { readdir, stat } from "node:fs/promises"
import { join } from "node:path"

const invalidItems: string[] = []

const distPath = join(import.meta.dirname, `../dist`)
const items = await readdir(distPath)

for (const item of items) {
	const itemPath = join(distPath, item)
	let isItemValid = false

	try {
		const itemStat = await stat(itemPath)

		if (itemStat.isDirectory()) {
			// Rule 1: Directories are allowed.
			isItemValid = true
		} else if (itemStat.isFile()) {
			// Rule 2: Files must match the "chunk-HASH.js" pattern.
			if (item.match(/^chunk-[0-9A-Za-z-_]{8}\.js$/)) {
				isItemValid = true
			}
		}
		// If the item is not a directory or a regular file (e.g., a symlink, socket, or device),
		// it is automatically considered invalid by falling through the checks.
	} catch (thrown) {
		// Handle cases where we can't get stats (e.g., broken symlink or permission error)
		if (thrown instanceof Error) {
			console.error(`Error checking item stat for ${item}: ${thrown.message}`)
			invalidItems.push(`${item} (Stat Error)`)
			continue
		}
		throw thrown
	}

	if (!isItemValid) {
		invalidItems.push(item)
	}
}

if (invalidItems.length > 0) {
	console.error(`❌ Invalid items found: ${invalidItems.join(`, `)}`)
	process.exit(1)
}

console.log(`✅ Build validated; no overlapping chunks found.`)
