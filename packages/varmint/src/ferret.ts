import * as fs from "node:fs"
import * as path from "node:path"
import { finished } from "node:stream/promises"
import { inspect } from "node:util"

import { closest } from "fastest-levenshtein"

import type { CacheMode } from "./cache-mode.ts"
import { prettyPrintDiffInline } from "./colors.ts"
import { sanitizeFilename } from "./sanitize-filename.ts"
import {
	SPECIAL_BREAK_SEQ as SBS,
	varmintWorkspaceManager as mgr,
} from "./varmint-workspace-manager.ts"

export type Loadable<T> = Promise<T> | T

export type StreamFunc = (...args: any[]) => Loadable<AsyncIterable<any>>

export type StreamType<F extends StreamFunc> =
	Awaited<ReturnType<F>> extends AsyncIterable<infer T> ? T : never

export type Promisified<T> = Promise<T extends Promise<unknown> ? Awaited<T> : T>

export type Ferreted<F extends StreamFunc> = {
	flush: () => void
	for: (subKey: string) => {
		get: (...args: Parameters<F>) => Promisified<ReturnType<F>>
	}
}

export class Ferret {
	public filenameCache: Map<string, string> = new Map()
	public filesTouched: Map<string, Set<string>> = new Map()
	public mode: CacheMode
	public baseDir: string
	public rootName: string

	public constructor(
		mode: CacheMode = `off`,
		baseDir: string = path.join(process.cwd(), `.varmint`, `.ferret`),
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

	private read<F extends StreamFunc>(
		key: string,
		subKey: string,
		args: Parameters<F>,
	): AsyncIterable<StreamType<F>> {
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
					`Ferret: input file for key "${key}" with "${subKey}" was not found. Directory "${groupDirectory}" does not exist.`,
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
					`Ferret: input file for key "${key}" with subKey "${subKey}" was not found here:`,
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
				`Ferret: the content of the cached input file ${pathToInputFile} does not match the input provided.\n\nProvided:\n${inputStringified}\n\nCached:\n${inputFileContents}`,
			)
		}
		const pathToOutputFile = path.join(this.baseDir, key, `${subKey}.stream.txt`)
		const stream = fs.createReadStream(pathToOutputFile)
		let buffer = ``
		return {
			[Symbol.asyncIterator]: async function* () {
				for await (const chunk of stream) {
					buffer += chunk.toString()
					const lines = buffer.split(`\n`)
					while (lines.length > 1) {
						const line = lines.shift()
						if (line) {
							await new Promise((resolve) => setTimeout(resolve, 2))
							const [_time, piece] = line.split(`\t`)
							yield JSON.parse(piece)
						}
					}
					buffer = lines[0] ?? ``
				}
			},
		}
	}

	private async write<F extends StreamFunc>(
		key: string,
		subKey: string,
		args: Parameters<F>,
		get: F,
	): Promisified<ReturnType<F>> {
		const subDir = path.join(this.baseDir, key)
		const pathToInputFile = path.join(subDir, `${subKey}.input.json`)
		const pathToStreamFile = path.join(subDir, `${subKey}.stream.txt`)
		const inputStringified = JSON.stringify(args, null, `\t`)
		if (!fs.existsSync(this.baseDir)) {
			fs.mkdirSync(this.baseDir, { recursive: true })
		}
		if (!fs.existsSync(subDir)) {
			fs.mkdirSync(subDir)
		}
		fs.writeFileSync(pathToInputFile, inputStringified)
		if (fs.existsSync(pathToStreamFile)) {
			fs.rmSync(pathToStreamFile)
		}
		const originalAsyncIterable = await get(...args)
		fs.writeFileSync(pathToStreamFile, ``)
		return recordAsyncIterable(
			originalAsyncIterable,
			pathToStreamFile,
		) as Awaited<Promisified<ReturnType<F>>>
	}

	public add<F extends StreamFunc>(key: string, getStream: F): Ferreted<F> {
		const listName = `${this.rootName}${SBS}${sanitizeFilename(key)}` as const
		return {
			flush: () => {
				this.flush(key)
			},
			for: (unSafeSubKey: string) => {
				if (this.mode !== `off`) {
					if (!this.filesTouched.has(key)) {
						this.filesTouched.set(key, new Set())
					}
					if (
						mgr.storage.initialized &&
						!mgr.storage.getItem(`list${SBS}${listName}`)
					) {
						mgr.storage.setItem(`list${SBS}${listName}`, `true`)
					}
				}
				return {
					get: (...args: Parameters<F>): Promisified<ReturnType<F>> => {
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
							case `off`: {
								const stream = getStream(...args)
								if (stream instanceof Promise) {
									return stream as Promisified<ReturnType<F>>
								}
								return Promise.resolve(stream) as Promisified<ReturnType<F>>
							}
							case `read`: {
								return this.read<F>(key, subKey, args) as unknown as Promisified<
									ReturnType<F>
								>
							}
							case `write`: {
								return this.write<F>(key, subKey, args, getStream)
							}
							case `read-write`: {
								try {
									return this.read<F>(
										key,
										subKey,
										args,
									) as unknown as Promisified<ReturnType<F>>
								} catch (thrown) {
									if (thrown instanceof Error) {
										return this.write<F>(key, subKey, args, getStream)
									}
									throw thrown
								}
							}
						}
					},
				}
			},
		}
	}

	public flush(...args: string[]): void {
		for (const [key, filesTouched] of this.filesTouched.entries()) {
			if (args.length === 0 || args.includes(key)) {
				const subDir = path.join(this.baseDir, key)
				const subDirFiles = fs.readdirSync(subDir)
				for (const subDirFile of subDirFiles) {
					const subKey = subDirFile
						.replace(`.input.json`, ``)
						.replace(`.stream.txt`, ``)
					if (!filesTouched.has(subKey)) {
						console.info(`🧹 Flushing ${subKey}`)
						fs.unlinkSync(path.join(subDir, subDirFile))
					}
				}
			}
		}
	}
}

/** Records each traversal while preserving the original iterable's other properties. */
function recordAsyncIterable<T>(
	iterable: AsyncIterable<T>,
	pathToStreamFile: string,
): AsyncIterable<T> {
	const originalAsyncIterator = iterable[Symbol.asyncIterator].bind(iterable)
	iterable[Symbol.asyncIterator] = function (): AsyncIterableIterator<T> {
		const writeStream = fs.createWriteStream(pathToStreamFile, { flags: `a` })
		const closed = finished(writeStream, { cleanup: true })
		void closed.catch(() => {})
		let iterator: AsyncIterator<T> | undefined
		let initialized = false
		let producerDone = false
		let closing: Promise<void> | undefined
		let pending = Promise.resolve()

		const initialize = (): AsyncIterator<T> => {
			initialized = true
			return (iterator = originalAsyncIterator())
		}
		const close = (): Promise<void> => {
			closing ??= (async () => {
				let failed = false
				try {
					if (!producerDone) {
						if (!initialized) initialize()
						await iterator?.return?.()
					}
				} catch (error) {
					failed = true
					throw error
				} finally {
					writeStream.end()
					if (failed) await closed.catch(() => {})
					else await closed
				}
			})()
			return closing
		}
		const fail = async (error: unknown): Promise<never> => {
			await close().catch(() => {})
			throw error
		}
		// Async generators serialize next/return/throw; preserve that ordering here.
		const enqueue = <R>(operation: () => Promise<R>): Promise<R> => {
			const result = pending.then(operation)
			pending = result.then(
				() => {},
				() => {},
			)
			return result
		}
		return {
			[Symbol.asyncIterator]() {
				return this
			},
			next: () =>
				enqueue(async (): Promise<IteratorResult<T>> => {
					if (closing) return { done: true, value: undefined }
					try {
						const next = await (iterator ?? initialize()).next()
						if (next.done) {
							producerDone = true
							await close()
							return { done: true, value: undefined }
						}
						await new Promise<void>((resolve, reject) => {
							const line = `${performance.now()}\t${JSON.stringify(next.value)}\n`
							writeStream.write(line, `utf8`, (error) => {
								if (error) reject(error)
								else resolve()
							})
						})
						return { done: false, value: await next.value }
					} catch (error) {
						return fail(error)
					}
				}),
			return: (value?: unknown) =>
				enqueue(async () => {
					if (!closing) await close()
					return { done: true, value: await value }
				}),
			throw: (error?: unknown) => enqueue(() => fail(error)),
		}
	}
	return iterable
}
