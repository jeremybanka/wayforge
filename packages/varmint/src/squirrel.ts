import * as fs from "node:fs"
import * as path from "node:path"
import { inspect } from "node:util"

import { closest } from "fastest-levenshtein"

import type { CacheMode } from "./cache-mode.ts"
import { prettyPrintDiffInline } from "./colors.ts"
import { parseError, stringifyError } from "./error-interface.ts"
import { sanitizeFilename } from "./sanitize-filename.ts"
import {
	SPECIAL_BREAK_SEQ as SBS,
	varmintWorkspaceManager as mgr,
} from "./varmint-workspace-manager.ts"

export type AsyncFunc = (...args: any[]) => Promise<any>

export type Squirreled<F extends AsyncFunc> = {
	flush: () => void
	for: (subKey: string) => { get: F }
}

export class Squirrel {
	public filenameCache: Map<string, string> = new Map()
	public filesTouched: Map<string, Set<string>> = new Map()
	public mode: CacheMode
	public baseDir: string
	public rootName: string

	public constructor(
		mode: CacheMode = `off`,
		baseDir: string = path.join(process.cwd(), `.varmint`),
	) {
		this.mode = mode
		this.baseDir = baseDir
		this.rootName = sanitizeFilename(this.baseDir)
		if (
			mgr.storage.initialized &&
			!mgr.storage.getItem(`root${SBS}${this.rootName}`)
		) {
			mgr.storage.setItem(`root${SBS}${this.rootName}`, this.baseDir)
		}
	}

	private read<F extends AsyncFunc>(
		key: string,
		subKey: string,
		args: Parameters<F>,
	): Awaited<ReturnType<F>> {
		const groupDirectory = path.join(this.baseDir, key)
		const inputFilename = `${subKey}.input.json`
		const pathToInputFile = path.join(groupDirectory, inputFilename)
		if (!fs.existsSync(pathToInputFile)) {
			const doesGroupDirectoryExist = fs.existsSync(groupDirectory)
			if (!doesGroupDirectoryExist) {
				if (mgr.storage.initialized && this.mode === `read`) {
					mgr.storage.setItem(`DID_CACHE_MISS`, `true`)
				}
				throw new Error(
					`Squirrel: input file for key "${key}" with "${subKey}" was not found. Directory "${groupDirectory}" does not exist.`,
				)
			}
			const directoryFilenames = fs.readdirSync(groupDirectory)
			const directoryFiles = directoryFilenames
				.map((filename) => [
					filename,
					fs.readFileSync(path.join(groupDirectory, filename), `utf-8`),
				])
				.filter(([filename]) => filename.endsWith(`.input.json`))
			const allInputsPlain: string[] = []
			const allInputsMap: Map<string, { filename: string; contents: string }> =
				new Map()
			for (const [filename, contents] of directoryFiles) {
				const otherInputFilename = `\t${filename}`
				const otherInputFileDataPlain = `\t\t${inspect(JSON.parse(contents), {
					depth: Number.POSITIVE_INFINITY,
					colors: false,
				})
					.split(`\n`)
					.join(`\n\t\t`)}`

				const otherInput = otherInputFilename + `\n` + otherInputFileDataPlain
				allInputsPlain.push(otherInput)
				allInputsMap.set(otherInput, { filename: otherInputFilename, contents })
			}

			const inputData = {
				color: `\t${subKey}.input.json\n\t\t${inspect(args, {
					depth: Number.POSITIVE_INFINITY,
					colors: true,
				})
					.split(`\n`)
					.join(`\n\t\t`)}`,
				plain: `\t${subKey}.input.json\n\t\t${inspect(args, {
					depth: Number.POSITIVE_INFINITY,
					colors: false,
				})
					.split(`\n`)
					.join(`\n\t\t`)}`,
			}

			if (mgr.storage.initialized && this.mode === `read`) {
				mgr.storage.setItem(
					`unmatched${SBS}${inputFilename}`,
					JSON.stringify(args, null, `\t`),
				)
				mgr.storage.setItem(`DID_CACHE_MISS`, `true`)
			}

			const mostSimilarInputPlain = closest(inputData.plain, allInputsPlain)
			const prettyDiff = prettyPrintDiffInline(
				inputData.plain,
				mostSimilarInputPlain,
			)
			const {
				filename: mostSimilarInputFilename,
				contents: mostSimilarInputRawContent,
				// biome-ignore lint/style/noNonNullAssertion: the way this is set up, it's guaranteed to be there
			} = allInputsMap.get(mostSimilarInputPlain)!
			const mostSimilarInputContentsColor = `\t\t${inspect(
				JSON.parse(mostSimilarInputRawContent),
				{
					depth: Number.POSITIVE_INFINITY,
					colors: true,
				},
			)
				.split(`\n`)
				.join(`\n\t\t`)}`

			const mostSimilarInput =
				mostSimilarInputFilename + `\n` + mostSimilarInputContentsColor

			throw new Error(
				[
					`Squirrel: input file for key "${key}" with subKey "${subKey}" was not found here:`,
					`\t${groupDirectory}`,
					`This is the file we didn't find:`,
					inputData.color,
					`The most similar file in that directory is:`,
					mostSimilarInput,
					`Here's the difference between the two files:`,
					`${prettyDiff}`,
				].join(`\n`),
			)
		}
		const inputFileContents = fs.readFileSync(pathToInputFile, `utf-8`)
		const inputStringified = JSON.stringify(args, null, `\t`)
		if (inputStringified !== inputFileContents) {
			if (mgr.storage.initialized && this.mode === `read`) {
				mgr.storage.setItem(`DID_CACHE_MISS`, `true`)
			}
			throw new Error(
				`Squirrel: the content of the cached input file ${pathToInputFile} does not match the input provided.\n\nProvided:\n${inputStringified}\n\nCached:\n${inputFileContents}`,
			)
		}
		const pathToOutputFile = path.join(
			this.baseDir,
			`${key}/${subKey}.output.json`,
		)
		const fileText = fs.readFileSync(pathToOutputFile, `utf-8`)
		const errorParsed = parseError(fileText)
		if (errorParsed !== undefined) {
			return errorParsed as Awaited<ReturnType<F>>
		}
		return JSON.parse(fileText)
	}

	private async write<I extends any[], O>(
		key: string,
		subKey: string,
		args: I,
		get: (...args: I) => Promise<O>,
	): Promise<O> {
		const subDir = path.join(this.baseDir, key)
		const pathToInputFile = path.join(subDir, `${subKey}.input.json`)
		const pathToOutputFile = path.join(subDir, `${subKey}.output.json`)
		const inputStringified = JSON.stringify(args, null, `\t`)
		if (!fs.existsSync(this.baseDir)) {
			fs.mkdirSync(this.baseDir, { recursive: true })
		}
		if (!fs.existsSync(subDir)) {
			fs.mkdirSync(subDir)
		}
		fs.writeFileSync(pathToInputFile, inputStringified)
		if (fs.existsSync(pathToOutputFile)) {
			fs.unlinkSync(pathToOutputFile)
		}
		const output = await get(...args)
		let outputStringified: string
		if (output instanceof Error) {
			outputStringified = stringifyError(output)
		} else {
			outputStringified = JSON.stringify(output, null, `\t`)
		}
		fs.writeFileSync(pathToOutputFile, outputStringified)
		return output
	}

	public add<F extends AsyncFunc>(key: string, get: F): Squirreled<F> {
		const listName = `${this.rootName}${SBS}${sanitizeFilename(key)}` as const
		return {
			flush: () => {
				this.flush(key)
			},
			for: (unSafeSubKey: string) => {
				if (this.mode !== `off`) {
					this.filesTouched.set(key, new Set())
					if (
						mgr.storage.initialized &&
						!mgr.storage.getItem(`list${SBS}${listName}`)
					) {
						mgr.storage.setItem(`list${SBS}${listName}`, `true`)
					}
				}
				return {
					get: (async (
						...args: Parameters<F>
					): Promise<Awaited<ReturnType<F>>> => {
						let subKey = unSafeSubKey
						if (this.mode !== `off`) {
							let cachedSubKey = this.filenameCache.get(unSafeSubKey)
							if (!cachedSubKey) {
								cachedSubKey = sanitizeFilename(unSafeSubKey)
								this.filenameCache.set(unSafeSubKey, cachedSubKey)
							}
							subKey = cachedSubKey
							this.filesTouched.get(key)?.add(subKey)
							const fileName = `${listName}${SBS}${subKey}` as const
							const fileNameTagged = `file${SBS}${fileName}` as const
							if (
								mgr.storage.initialized &&
								!mgr.storage.getItem(fileNameTagged)
							) {
								mgr.storage.setItem(fileNameTagged, `true`)
							}
						}
						switch (this.mode) {
							case `off`:
								return get(...args)
							case `read`: {
								return this.read<F>(key, subKey, args)
							}
							case `write`: {
								return this.write(key, subKey, args, get)
							}
							case `read-write`: {
								try {
									return this.read<F>(key, subKey, args)
								} catch (thrown) {
									if (thrown instanceof Error) {
										return this.write(key, subKey, args, get)
									}
									throw thrown
								}
							}
						}
					}) as F,
				}
			},
		}
	}

	public flush(...args: string[]): void {
		console.log(this.filesTouched)
		for (const [key, filesTouched] of this.filesTouched.entries()) {
			if (args.length === 0 || args.includes(key)) {
				const subDir = path.join(this.baseDir, key)
				const subDirFiles = fs.readdirSync(subDir)
				for (const subDirFile of subDirFiles) {
					const subKey = subDirFile
						.replace(`.input.json`, ``)
						.replace(`.output.json`, ``)
					if (!filesTouched.has(subKey)) {
						console.info(`🧹 Flushing ${subKey}`)
						fs.unlinkSync(path.join(subDir, subDirFile))
					}
				}
			}
		}
	}
}
