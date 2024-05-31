import * as fs from "node:fs"
import * as path from "node:path"

export type SquirrelMode = `off` | `read-write` | `read` | `write`

export type AsyncFunc = (...args: any[]) => Promise<any>

export class Squirrel {
	public filesTouched = new Map<string, Set<string>>()

	public constructor(
		public mode: SquirrelMode = `off`,
		public baseDir: string = path.join(process.cwd(), `.varmint`),
	) {}

	private read<F extends AsyncFunc>(
		key: string,
		subKey: string,
		args: Parameters<F>,
	): Awaited<ReturnType<F>> {
		const pathToInputFile = path.join(
			this.baseDir,
			`${key}/${subKey}.input.json`,
		)
		if (!fs.existsSync(pathToInputFile)) {
			throw new Error(`Squirrel: input file for key "${key}" does not exist`)
		}
		const inputFileContents = fs.readFileSync(pathToInputFile, `utf-8`)
		const inputStringified = JSON.stringify(args, null, `\t`)
		if (inputStringified !== inputFileContents) {
			throw new Error(
				`Squirrel: the content of the cached input file ${pathToInputFile} does not match the input provided.\n\nProvided:\n${inputStringified}\n\nCached:\n${inputFileContents}`,
			)
		}
		const pathToOutputFile = path.join(
			this.baseDir,
			`${key}/${subKey}.output.json`,
		)
		return JSON.parse(fs.readFileSync(pathToOutputFile, `utf-8`))
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
			fs.mkdirSync(this.baseDir)
		}
		if (!fs.existsSync(subDir)) {
			fs.mkdirSync(subDir)
		}
		fs.writeFileSync(pathToInputFile, inputStringified)
		if (fs.existsSync(pathToOutputFile)) {
			fs.unlinkSync(pathToOutputFile)
		}
		const output = await get(...args)
		fs.writeFileSync(pathToOutputFile, JSON.stringify(output, null, `\t`))
		return output
	}

	public add<F extends AsyncFunc>(
		key: string,
		get: F,
	): {
		for: (subKey: string) => { get: F }
	} {
		return {
			for: (subKey: string) => {
				this.filesTouched.set(key, new Set())
				return {
					get: (async (
						...args: Parameters<F>
					): Promise<Awaited<ReturnType<F>>> => {
						if (this.mode !== `off`) {
							this.filesTouched.get(key)?.add(subKey)
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

	public flush(): void {
		for (const [key, filesTouched] of this.filesTouched.entries()) {
			const subDir = path.join(this.baseDir, key)
			const subDirFiles = fs.readdirSync(subDir)
			for (const subDirFile of subDirFiles) {
				const [subKey] = subDirFile.split(`.`)
				if (!filesTouched.has(subKey)) {
					fs.unlinkSync(path.join(subDir, subDirFile))
				}
			}
		}
	}
}
