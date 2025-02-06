import * as fs from "node:fs"
import * as path from "node:path"
import { resolve } from "node:path"

import cachedir from "cachedir"
import { isPackageExists } from "local-pkg"
import { FilesystemStorage } from "safedeposit"

import { sanitizeFilename } from "./sanitize-filename.ts"
import { type Json, parseJson, type stringified } from "./typed-json.ts"

const GLOBAL_CACHE_FOLDER = cachedir(`varmint`)
const PROJECT_IDENTIFIER = sanitizeFilename(process.cwd(), 150)
const CACHE_FOLDER = resolve(GLOBAL_CACHE_FOLDER, PROJECT_IDENTIFIER)

export const SPECIAL_BREAK_SEQ = `_-$-_-$-_`
export type SpecialBreakSequence = typeof SPECIAL_BREAK_SEQ
export const FILE_TAG = `file${SPECIAL_BREAK_SEQ}`
export const LIST_TAG = `list${SPECIAL_BREAK_SEQ}`
export const ROOT_TAG = `root${SPECIAL_BREAK_SEQ}`
export const UNMATCHED_TAG = `unmatched${SPECIAL_BREAK_SEQ}`
export type FileTag = typeof FILE_TAG
export type ListTag = typeof LIST_TAG
export type RootTag = typeof ROOT_TAG
export type UnmatchedTag = typeof UNMATCHED_TAG
export type FileSlug = `${FileTag}${string}`
export type ListSlug = `${ListTag}${string}`
export type RootSlug = `${RootTag}${string}`
export type UnmatchedSlug = `${UnmatchedTag}${string}`
export type FilesTouched = Record<FileSlug, `true`>
export type ListsTouched = Record<ListSlug, `true`>
export type RootsTouched = Record<RootSlug, string>
export type UnmatchedInputs = Record<
	UnmatchedSlug,
	stringified<Json.Serializable>
>

export type VarmintFileSystemState = FilesTouched &
	ListsTouched &
	RootsTouched &
	UnmatchedInputs & {
		DID_CACHE_MISS: `true`
	}

export const varmintWorkspaceManager = {
	storage: new FilesystemStorage<VarmintFileSystemState>({
		path: CACHE_FOLDER,
		eagerInit: false,
	}),
	startGlobalTracking(): void {
		console.log(
			`🐿️  Starting global tracking of varmint files using project identifier "${PROJECT_IDENTIFIER}"`,
		)
		if (varmintWorkspaceManager.storage.initialized) {
			console.error(
				`💥 The global cache for the project "${PROJECT_IDENTIFIER}" was found already initialized. Clearing it and starting fresh.`,
			)
			varmintWorkspaceManager.storage.clear()
		}
		varmintWorkspaceManager.storage.initialize()
	},
	async uploadUnusedFilesToArtifacts(): Promise<void> {
		console.log(
			`🐿️  Uploading unused files to artifacts using project identifier "${PROJECT_IDENTIFIER}"`,
		)
		const unmatched: UnmatchedSlug[] = []
		for (const dirContent of fs.readdirSync(
			varmintWorkspaceManager.storage.rootDir,
		)) {
			if (startsWith(`unmatched${SPECIAL_BREAK_SEQ}`, dirContent)) {
				unmatched.push(dirContent)
			}
		}
		if (unmatched.length === 0) {
			console.log(`🐿️ `, `No unmatched input files found.`)
			return
		}
		console.log(
			`🐿️ `,
			`Found the following unmatched files:`,
			`\n\t- ${unmatched.join(`\n\t`)}\n`,
			`in root folder:\n\t`,
			CACHE_FOLDER,
		)
		if (process.env.GITHUB_ACTIONS) {
			if (isPackageExists(`@actions/artifact`)) {
				const { DefaultArtifactClient } = await import(`@actions/artifact`)

				const artifactClient = new DefaultArtifactClient()
				await artifactClient.uploadArtifact(
					`Varmint: ${unmatched.length} Unmatched Inputs`,
					unmatched,
					CACHE_FOLDER,
					{
						retentionDays: 1,
					},
				)
			} else {
				console.warn(
					`💥 Skipping artifact upload because @actions/artifact is not installed.`,
				)
			}
		} else {
			console.warn(
				`💥 Skipping artifact upload because GITHUB_ACTIONS is not set.`,
			)
		}
	},
	endGlobalTrackingAndFlushUnusedFiles(): void {
		console.log(
			`🐿️  Ending global tracking of varmint files using project identifier "${PROJECT_IDENTIFIER}" and starting cleanup of untouched	 files.`,
		)
		if (!varmintWorkspaceManager.storage.initialized) {
			console.error(
				`💥 called flushGlobal, but the global cache wasn't initialized with startGlobalTracking`,
			)
			return
		}
		const dirContents = fs.readdirSync(varmintWorkspaceManager.storage.rootDir)
		const realRoots = new Map<string, string>()
		const roots: RootSlug[] = []
		const lists: ListSlug[] = []
		const files: FileSlug[] = []
		for (const dirContent of dirContents) {
			if (startsWith(`root${SPECIAL_BREAK_SEQ}`, dirContent)) {
				roots.push(dirContent)
			} else if (startsWith(`list${SPECIAL_BREAK_SEQ}`, dirContent)) {
				lists.push(dirContent)
			} else if (startsWith(`file${SPECIAL_BREAK_SEQ}`, dirContent)) {
				files.push(dirContent)
			}
		}
		const didCacheMiss =
			varmintWorkspaceManager.storage.getItem(`DID_CACHE_MISS`)
		if (!didCacheMiss) {
			const tree: Map<string, Map<string, Set<string>>> = new Map()
			for (const root of roots) {
				const rootName = root.replace(ROOT_TAG, ``)
				tree.set(rootName, new Map())
				const rootPath = varmintWorkspaceManager.storage.getItem(root)
				if (rootPath) {
					realRoots.set(rootName, rootPath)
				} else {
					console.error(
						`💥 Could not find folder ${rootPath} referenced in the global cache`,
					)
				}
			}
			for (const list of lists) {
				const listPath = list.replace(LIST_TAG, ``)
				const [listRootName, listName] = listPath.split(SPECIAL_BREAK_SEQ)
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
				const filePath = file.replace(FILE_TAG, ``)
				const [listRootName, listName, subKey] =
					filePath.split(SPECIAL_BREAK_SEQ)
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
			console.log(`🐿️ `, tree)
			for (const [rootName, rootMap] of tree.entries()) {
				const realRoot = realRoots.get(rootName)
				if (!realRoot) {
					console.error(`💥 Could not find root ${rootName}`)
					continue
				}
				const realRootStillExists = fs.existsSync(realRoot)
				if (!realRootStillExists) {
					console.warn(
						`💥 Root folder ${realRoot}, identified as being used during tracking, no longer exists during cleanup.`,
					)
					continue
				}
				const realRootContents = fs.readdirSync(realRoot)
				for (const rootContent of realRootContents) {
					if (rootContent !== `.ferret` && !rootMap.has(rootContent)) {
						const pathForRemoval = path.join(realRoot, rootContent)
						console.log(`🧹 globalFlush: removing directory ${pathForRemoval}`)
						fs.rmSync(pathForRemoval, { recursive: true })
					}
				}
				for (const [listName, list] of rootMap.entries()) {
					const realList = path.join(realRoot, listName)
					const realListStillExists = fs.existsSync(realList)
					if (!realListStillExists) {
						console.warn(
							`💥 List folder ${realList}, identified as being used during tracking, no longer exists.`,
						)
						continue
					}
					const realListContents = fs.readdirSync(realList)
					for (const realListContent of realListContents) {
						const contentTrimmed = realListContent
							.replace(`.input.json`, ``)
							.replace(`.output.json`, ``)
							.replace(`.stream.txt`, ``)
						if (!list.has(contentTrimmed)) {
							const pathForRemoval = path.join(realList, realListContent)
							console.log(`🧹 globalFlush: removing file ${pathForRemoval}`)
							fs.rmSync(pathForRemoval)
						}
					}
				}
			}
		}
		fs.rmSync(varmintWorkspaceManager.storage.rootDir, { recursive: true })
	},
}

function startsWith<T extends string>(
	prefix: T,
	str: string,
): str is `${T}${string}` {
	return str.startsWith(prefix)
}
