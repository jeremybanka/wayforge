import * as fs from "node:fs"
import * as path from "node:path"

import type { Json } from "./serializable"

export type FileboxMode = `off` | `read-write` | `read` | `write`

export class Filebox {
	public constructor(
		public mode: FileboxMode = `off`,
		public baseDir: string = path.join(process.cwd(), `.filebox`),
	) {}

	private read<I extends any[], O>(key: string, subKey: string, args: I): O {
		const pathToInputFile = path.join(
			this.baseDir,
			`${key}.${subKey}.input.json`,
		)
		if (!fs.existsSync(pathToInputFile)) {
			throw new Error(`Filebox: input file for key "${key}" does not exist`)
		}
		const inputFileContents = fs.readFileSync(pathToInputFile, `utf-8`)
		const inputStringified = JSON.stringify(args)
		if (inputStringified !== inputFileContents) {
			throw new Error(
				`Filebox: the input for "key" contained in the filebox does not match the input provided.`,
			)
		}
		const pathToOutputFile = path.join(
			this.baseDir,
			`${key}.${subKey}.output.json`,
		)
		return JSON.parse(fs.readFileSync(pathToOutputFile, `utf-8`))
	}

	private async write<I extends any[], O>(
		key: string,
		subKey: string,
		args: I,
		get: (...args: I) => Promise<O>,
	): Promise<O> {
		const pathToInputFile = path.join(
			this.baseDir,
			`${key}.${subKey}.input.json`,
		)
		const pathToOutputFile = path.join(
			this.baseDir,
			`${key}.${subKey}.output.json`,
		)
		const inputStringified = JSON.stringify(args)
		if (!fs.existsSync(this.baseDir)) {
			fs.mkdirSync(this.baseDir)
		}
		fs.writeFileSync(pathToInputFile, inputStringified)
		const output = await get(...args)
		fs.writeFileSync(pathToOutputFile, JSON.stringify(output))
		return output
	}

	public add<I extends any[], O>({
		key,
		get,
	}: { key: string; get: (...args: I) => Promise<O> }): {
		get: (key: string, ...args: I) => Promise<O>
	} {
		return {
			get: async (subKey: string, ...args: I): Promise<O> => {
				switch (this.mode) {
					case `off`:
						return get(...args)
					case `read`: {
						return this.read<I, O>(key, subKey, args)
					}
					case `write`: {
						return this.write(key, subKey, args, get)
					}
					case `read-write`: {
						try {
							return this.read<I, O>(key, subKey, args)
						} catch (thrown) {
							if (thrown instanceof Error) {
								return this.write(key, subKey, args, get)
							}
							throw thrown
						}
					}
				}
			},
		}
	}
}
