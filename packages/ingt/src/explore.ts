import type { PathLike } from "node:fs"
import { readdirSync } from "node:fs"
import { join } from "node:path"

import type { Json } from "~/packages/anvl/src/json"

import type { FilestoreOptions } from "./options"

export const readDirectory = (dir: PathLike): Error | Json.Array<string> => {
	try {
		const files = readdirSync(dir)
		return files
	} catch (caught) {
		if (caught instanceof Error) return caught
		throw caught
	}
}

export type ScanResult = Record<`/${string}`, Json.Array<string>>
export type Scan = (...paths: string[]) => Error | ScanResult

export const initScanner = ({ baseDir }: FilestoreOptions): Scan => {
	const scan: Scan = (...paths: string[]): Error | ScanResult => {
		try {
			return paths.reduce<ScanResult>((acc, path) => {
				const files = readDirectory(join(baseDir, path))
				if (files instanceof Error) throw files
				acc[String(path)] = files
				return acc
			}, {})
		} catch (caught) {
			if (caught instanceof Error) return caught
			throw caught
		}
	}
	return scan
}
