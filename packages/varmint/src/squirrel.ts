import * as fs from "node:fs"
import * as path from "node:path"
import { inspect } from "node:util"

import type { CacheMode } from "./cache-mode"
import { sanitizeFilename } from "./sanitize-filename"
import { storage } from "./varmint-filesystem-state"

export type AsyncFunc = (...args: any[]) => Promise<any>

export type Squirreled<F extends AsyncFunc> = {
	flush: () => void
	for: (subKey: string) => { get: F }
}

export class Squirrel {
	public filenameCache = new Map<string, string>()
	public rootName = sanitizeFilename(this.baseDir)
	public filesTouched = new Map<string, Set<string>>()

	public constructor(
		public mode: CacheMode = `off`,
		public baseDir: string = path.join(process.cwd(), `.varmint`),
	) {
		if (storage.initialized && !storage.getItem(`root__${this.rootName}`)) {
			storage.setItem(`root__${this.rootName}`, this.baseDir)
		}
	}

	private read<F extends AsyncFunc>(
		key: string,
		subKey: string,
		args: Parameters<F>,
	): Awaited<ReturnType<F>> {
		const groupDirectory = path.join(this.baseDir, key)
		const pathToInputFile = path.join(groupDirectory, `${subKey}.input.json`)
		if (!fs.existsSync(pathToInputFile)) {
			const doesGroupDirectoryExist = fs.existsSync(groupDirectory)
			if (!doesGroupDirectoryExist) {
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
				`Squirrel: input file for key "${key}" with subKey "${subKey}" (${pathToInputFile}) was not found. Directory "${groupDirectory}" exists, but the file does not. Below is a list of CACHED INPUT FILES from that directory and their contents, followed by YOUR INPUT DATA.\n\nCACHED INPUT FILES:\n${allInputs.join(`\n`)}\n\nYOUR INPUT DATA:\n${inputData}\n`,
			)
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
		const outputStringified = JSON.stringify(output, null, `\t`)
		fs.writeFileSync(pathToOutputFile, outputStringified)
		return output
	}

	public add<F extends AsyncFunc>(key: string, get: F): Squirreled<F> {
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
					get: (async (
						...args: Parameters<F>
					): Promise<Awaited<ReturnType<F>>> => {
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

	public static startGlobalTracking(): void {
		if (storage.initialized) {
			console.error(
				`💥 called startGlobalTracking, but the global cache was already initialized`,
			)
			return
		}
		storage.initialize()
	}
	public static flushGlobal(): void {
		if (!storage.initialized) {
			console.error(
				`💥 called flushGlobal, but the global cache wasn't initialized with startGlobalTracking`,
			)
			return
		}
		const dirContents = fs.readdirSync(storage.rootDir)
		const realRoots = new Map<string, string>()
		const roots: `root__${string}`[] = []
		const lists: `list__${string}`[] = []
		const files: `file__${string}`[] = []
		for (const dirContent of dirContents) {
			if (startsWith(`root__`, dirContent)) {
				roots.push(dirContent)
			} else if (startsWith(`list__`, dirContent)) {
				lists.push(dirContent)
			} else if (startsWith(`file__`, dirContent)) {
				files.push(dirContent)
			}
		}
		const tree: Map<string, Map<string, Set<string>>> = new Map()
		for (const root of roots) {
			const rootName = root.replace(`root__`, ``)
			tree.set(rootName, new Map())
			const rootPath = storage.getItem(root)
			if (rootPath) {
				realRoots.set(rootName, rootPath)
			} else {
				console.error(
					`💥 Could not find folder ${rootPath} referenced in the global cache`,
				)
			}
		}
		for (const list of lists) {
			const listPath = list.replace(`list__`, ``)
			const [listRootName, listName] = listPath.split(`__`)
			const listRoot = tree.get(listRootName)
			if (listRoot) {
				listRoot.set(listName, new Set())
			} else {
				console.error(
					`💥 Could not find root ${listRootName} for list ${listName}`,
				)
			}
		}
		for (const file of files) {
			const filePath = file.replace(`file__`, ``)
			const [listRootName, listName, subKey] = filePath.split(`__`)
			const listRoot = tree.get(listRootName)
			if (listRoot) {
				const list = listRoot.get(listName)
				if (list) {
					list.add(subKey)
				} else {
					console.error(
						`💥 Could not find list ${listName} for file ${filePath}`,
					)
				}
			} else {
				console.error(
					`💥 Could not find root ${listRootName} for file ${filePath}`,
				)
			}
		}
		for (const [rootName, rootMap] of tree.entries()) {
			const realRoot = realRoots.get(rootName)
			if (!realRoot) {
				console.error(`💥 Could not find root ${rootName}`)
				continue
			}
			const realRootContents = fs.readdirSync(realRoot)
			for (const rootContent of realRootContents) {
				if (!rootMap.has(rootContent)) {
					const pathForRemoval = path.join(realRoot, rootContent)
					console.log(`🧹 globalFlush: removing directory ${pathForRemoval}`)
					fs.rmSync(pathForRemoval, { recursive: true })
				}
			}
			for (const [listName, list] of rootMap.entries()) {
				const realList = path.join(realRoot, listName)
				const realListContents = fs.readdirSync(realList)
				for (const realListContent of realListContents) {
					const contentTrimmed = realListContent
						.replace(`.input.json`, ``)
						.replace(`.output.json`, ``)
						.replace(`stream.txt`, ``)
					if (!list.has(contentTrimmed)) {
						const pathForRemoval = path.join(realList, realListContent)
						console.log(`🧹 globalFlush: removing file ${pathForRemoval}`)
						fs.rmSync(pathForRemoval)
					}
				}
			}
		}
		fs.rmSync(storage.rootDir, { recursive: true })
	}
}

function startsWith<T extends string>(
	prefix: T,
	str: string,
): str is `${T}${string}` {
	return str.startsWith(prefix)
}
