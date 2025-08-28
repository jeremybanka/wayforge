#!/usr/bin/env bun

import fs from "node:fs"
import path from "node:path"

import { glob } from "glob"

/**
 * Gets the total size of files matching one or more glob patterns.
 * @param patterns Array of glob patterns or a single glob pattern
 */
async function getTotalSize(patterns: string[] | string): Promise<number> {
	const patternList = Array.isArray(patterns) ? patterns : [patterns]
	const seen = new Set<string>()
	let totalSize = 0

	for (const pattern of patternList) {
		const matches = await glob(pattern, { nodir: false })

		for (const match of matches) {
			if (seen.has(match)) continue // avoid double counting
			seen.add(match)

			const stat = fs.statSync(match)

			if (stat.isFile()) {
				totalSize += stat.size
			} else if (stat.isDirectory()) {
				totalSize += await getDirectorySize(match)
			}
		}
	}

	return totalSize
}

/**
 * Recursively gets the size of all files in a directory
 */
async function getDirectorySize(dir: string): Promise<number> {
	const entries = fs.readdirSync(dir, { withFileTypes: true })
	let size = 0

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name)
		const stat = fs.statSync(fullPath)

		if (entry.isFile()) {
			size += stat.size
		} else if (entry.isDirectory()) {
			size += await getDirectorySize(fullPath)
		}
	}

	return size
}

console.log(import.meta.main)

if (import.meta.main) {
	const ordersOfMagnitude = [`tb`, `gb`, `mb`, `kb`, `b`]
	let total = await getTotalSize([
		`dist/main/**/*.js`,
		`dist/json/**/*.js`,
		`dist/internal/**/*.js`,
		`dist/react/**/*.js`,
		`dist/react-devtools/**/*.js`,
		// `dist/realtime/**/*.js`,
		// `dist/realtime-client/**/*.js`,
		// `dist/realtime-react/**/*.js`,
		// `dist/realtime-server/**/*.js`,
		// `dist/realtime-testing/**/*.js`,
		// `dist/transceivers/**/*.js`,
		// `dist/web/**/*.js`,
	])
	let order = ordersOfMagnitude.pop()
	while (total > 1024 && ordersOfMagnitude.length > 0) {
		total /= 1024
		order = ordersOfMagnitude.pop()
	}
	console.log(`Total size: ${total.toFixed(2)} ${order}`)
}
