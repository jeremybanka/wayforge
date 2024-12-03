import { createHash } from "node:crypto"
import * as fs from "node:fs"
import * as path from "node:path"

import OpenAI from "openai"

import type { CacheMode } from "./cache-mode"
import { sanitizeFilename } from "./sanitize-filename"

// const openAiClient = new OpenAI({
// 	apiKey: import.meta.env.VITE_OPENAI_API_KEY,
// 	dangerouslyAllowBrowser: process.env.NODE_ENV === `test`,
// })
// const a = await openAiClient.chat.completions.create({
// 	model: `gpt-4-turbo`,
// 	messages: [],
// 	stream: true,
// })
// for await (const chunk of a) {
// }

export class Ferret {
	public filenameCache = new Map<string, string>()
	public filesTouched = new Set<string>()

	public constructor(
		public mode: CacheMode = `off`,
		public cacheDir: string = path.join(process.cwd(), `.varmint`, `.ferret`),
	) {}

	public for(unSafeSubKey: string): {
		get: <T>(originalAsyncIterable: AsyncIterable<T>) => AsyncIterable<T>
	} {
		return {
			get: (originalAsyncIterable) => {
				let subKey = unSafeSubKey
				if (this.mode !== `off`) {
					let cachedSubKey = this.filenameCache.get(unSafeSubKey)
					if (!cachedSubKey) {
						cachedSubKey = sanitizeFilename(unSafeSubKey)
						this.filenameCache.set(unSafeSubKey, subKey)
						subKey = cachedSubKey
					}
					this.filesTouched.add(subKey)
				}
				switch (this.mode) {
					case `off`:
						return originalAsyncIterable
					case `read`: {
						return addMiddleware(originalAsyncIterable, (chunk) => {
							return chunk
						})
					}
					case `write`: {
						if (!fs.existsSync(this.cacheDir)) {
							fs.mkdirSync(this.cacheDir)
						}
						if (!fs.existsSync(this.cacheDir)) {
							fs.mkdirSync(this.cacheDir)
						}
						const filePath = path.join(this.cacheDir, `${subKey}.stream.txt`)
						if (fs.existsSync(filePath)) {
							fs.rmSync(filePath)
						}
						const writeStream = fs.createWriteStream(filePath, { flags: `a` })
						return addMiddleware(originalAsyncIterable, async (chunk) => {
							return new Promise((resolve, reject) => {
								const line = `${performance.now()}\t${JSON.stringify(chunk)}\n`
								// Write the chunk to the file
								if (
									!writeStream.write(line, `utf8`, (err) => {
										if (err) {
											reject(err)
										} else {
											resolve(chunk) // Return the chunk unchanged
										}
									})
								) {
									// Handle backpressure
									writeStream.once(`drain`, () => {
										resolve(chunk)
									})
								}
							})
						})
					}
					case `read-write`: {
						return addMiddleware(originalAsyncIterable, (chunk) => {
							return chunk
						})
					}
				}
			},
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
function addMiddleware<T>(
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
// // Example Usage
// ;(async () => {
// 	// Original AsyncIterable
// 	const asyncIterable = {
// 		async *[Symbol.asyncIterator]() {
// 			yield `chunk1`
// 			yield `chunk2`
// 			yield `chunk3`
// 		},
// 	}

// 	// Middleware to log each chunk
// 	const loggingMiddleware = async (chunk: string) => {
// 		console.log(`Processing:`, chunk)
// 		return chunk // Optionally modify the chunk
// 	}

// 	// Add middleware to the async iterable
// 	addMiddleware(asyncIterable, loggingMiddleware)

// 	// Use the async iterable
// 	for await (const chunk of asyncIterable) {
// 		console.log(`Final Output:`, chunk)
// 	}
// })()
