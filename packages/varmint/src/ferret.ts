import * as fs from "node:fs"
import * as path from "node:path"
import { inspect } from "node:util"

import type { CacheMode } from "./cache-mode"
import { sanitizeFilename } from "./sanitize-filename"
import { storage } from "./varmint-filesystem-state"

export type Loadable<T> = Promise<T> | T

export type StreamFunc = (...args: any[]) => Loadable<AsyncIterable<any>>

export type StreamType<F extends StreamFunc> = Awaited<
	ReturnType<F>
> extends AsyncIterable<infer T>
	? T
	: never

export type Promisified<T> = Promise<T extends Promise<unknown> ? Awaited<T> : T>

export type Ferreted<F extends StreamFunc> = {
	flush: () => void
	for: (subKey: string) => {
		get: (...args: Parameters<F>) => Promisified<ReturnType<F>>
	}
}

export class Ferret {
	public filenameCache = new Map<string, string>()
	public rootName = sanitizeFilename(this.baseDir)
	public filesTouched = new Map<string, Set<string>>()

	public constructor(
		public mode: CacheMode = `off`,
		public baseDir: string = path.join(process.cwd(), `.varmint`, `.ferret`),
	) {
		if (storage.initialized && !storage.getItem(`root__${this.rootName}`)) {
			storage.setItem(`root__${this.rootName}`, this.baseDir)
		}
	}

	private read<F extends StreamFunc>(
		key: string,
		subKey: string,
		args: Parameters<F>,
	): AsyncIterable<StreamType<F>> {
		const groupDirectory = path.join(this.baseDir, key)
		const pathToInputFile = path.join(groupDirectory, `${subKey}.input.json`)
		if (!fs.existsSync(pathToInputFile)) {
			const doesGroupDirectoryExist = fs.existsSync(groupDirectory)
			if (!doesGroupDirectoryExist) {
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
			const allInputs: string[] = []
			for (const [filename, contents] of directoryFiles) {
				const inputFileName = `\t${filename}`
				const inputFileData = `\t\t${inspect(JSON.parse(contents), {
					depth: Number.POSITIVE_INFINITY,
					colors: true,
				})
					.split(`\n`)
					.join(`\n\t\t`)}`
				allInputs.push(inputFileName, inputFileData)
			}

			const inputData = `\t${subKey}.input.json\n\t\t${inspect(args, {
				depth: Number.POSITIVE_INFINITY,
				colors: true,
			})
				.split(`\n`)
				.join(`\n\t\t`)}`

			throw new Error(
				`Ferret: input file for key "${key}" with subKey "${subKey}" (${pathToInputFile}) was not found. Directory "${groupDirectory}" exists, but the file does not. Below is a list of CACHED INPUT FILES from that directory and their contents, followed by YOUR INPUT DATA.\n\nCACHED INPUT FILES:\n${allInputs.join(`\n`)}\n\nYOUR INPUT DATA:\n${inputData}\n`,
			)
		}
		const inputFileContents = fs.readFileSync(pathToInputFile, `utf-8`)
		const inputStringified = JSON.stringify(args, null, `\t`)
		if (inputStringified !== inputFileContents) {
			throw new Error(
				`Squirrel: the content of the cached input file ${pathToInputFile} does not match the input provided.\n\nProvided:\n${inputStringified}\n\nCached:\n${inputFileContents}`,
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
							const [time, piece] = line.split(`\t`)
							yield JSON.parse(piece)
						}
					}
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
		const writeStream = fs.createWriteStream(pathToStreamFile, {
			flags: `a`,
		})

		const originalAsyncIterable = await get(...args)
		return addMiddlewareToAsyncIterable(originalAsyncIterable, (chunk) => {
			return new Promise((resolve, reject) => {
				const line = `${performance.now()}\t${JSON.stringify(chunk)}\n`
				if (
					!writeStream.write(line, `utf8`, (err) => {
						if (err) {
							reject(err)
						} else {
							resolve(chunk) // Return the chunk unchanged
						}
					})
				) {
					// backpressure
					writeStream.once(`drain`, () => {
						resolve(chunk)
					})
				}
			})
		}) as Awaited<Promisified<ReturnType<F>>>
	}

	public add<F extends StreamFunc>(key: string, getStream: F): Ferreted<F> {
		const listName = `${this.rootName}__${sanitizeFilename(key)}` as const
		return {
			flush: () => {
				this.flush(key)
			},
			for: (unSafeSubKey: string) => {
				if (this.mode !== `off`) {
					this.filesTouched.set(listName, new Set())
					if (storage.initialized && !storage.getItem(`list__${listName}`)) {
						storage.setItem(`list__${listName}`, `true`)
					}
				}
				return {
					get: (...args: Parameters<F>) => {
						let subKey = unSafeSubKey
						if (this.mode !== `off`) {
							let cachedSubKey = this.filenameCache.get(unSafeSubKey)
							if (!cachedSubKey) {
								cachedSubKey = sanitizeFilename(unSafeSubKey)
								this.filenameCache.set(unSafeSubKey, subKey)
								subKey = cachedSubKey
							}
							this.filesTouched.get(key)?.add(subKey)
							const fileName = `${listName}__${subKey}` as const
							const fileNameTagged = `file__${fileName}` as const
							if (storage.initialized && !storage.getItem(fileNameTagged)) {
								storage.setItem(fileNameTagged, `true`)
							}
						}
						switch (this.mode) {
							case `off`: {
								const stream = getStream(...args)
								if (stream instanceof Promise) {
									return stream
								}
								return Promise.resolve(stream)
							}
							case `read`: {
								return this.read<F>(key, subKey, args)
							}
							case `write`: {
								return this.write<F>(key, subKey, args, getStream) as any
							}
							case `read-write`: {
								try {
									return this.read<F>(key, subKey, args)
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

/**
 * Adds middleware to an AsyncIterable.
 * The middleware is a function that processes each yielded value.
 *
 * @param iterable The original AsyncIterable to modify.
 * @param middleware A function that processes each chunk and optionally logs or modifies it.
 * @returns The same AsyncIterable, but with the middleware applied.
 */
function addMiddlewareToAsyncIterable<T>(
	iterable: AsyncIterable<T>,
	middleware: (chunk: T) => Promise<T> | T,
): AsyncIterable<T> {
	// Save the original [Symbol.asyncIterator] for restoration if needed
	const originalAsyncIterator = iterable[Symbol.asyncIterator].bind(iterable)

	// Replace the [Symbol.asyncIterator] with the middleware-enhanced iterator
	iterable[Symbol.asyncIterator] = async function* () {
		const iterator = originalAsyncIterator()
		let nextResult: IteratorResult<T>

		while (!(nextResult = await iterator.next()).done) {
			// Apply the middleware function to each chunk
			yield await middleware(nextResult.value)
		}
	}

	return iterable
}
