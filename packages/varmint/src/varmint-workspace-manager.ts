import * as fs from "node:fs"
import * as path from "node:path"
import { resolve } from "node:path"

import cachedir from "cachedir"
import { FilesystemStorage } from "safedeposit"

import { sanitizeFilename } from "./sanitize-filename.ts"

const GLOBAL_CACHE_FOLDER = cachedir(`varmint`)
const CACHE_FOLDER = resolve(
	GLOBAL_CACHE_FOLDER,
	sanitizeFilename(process.cwd()),
)

export type FilesTouched = Record<`file__${string}`, `true`>
export type ListsTouched = Record<`list__${string}`, `true`>
export type RootsTouched = Record<`root__${string}`, string>

export type VarmintFileSystemState = FilesTouched & ListsTouched & RootsTouched

export const varmintWorkspaceManager = {
	storage: new FilesystemStorage<VarmintFileSystemState>({
		path: CACHE_FOLDER,
		eagerInit: false,
	}),
	startGlobalTracking(): void {
		if (varmintWorkspaceManager.storage.initialized) {
			console.error(
				`💥 called startGlobalTracking, but the global cache was already initialized`,
			)
			return
		}
		varmintWorkspaceManager.storage.initialize()
	},
	endGlobalTrackingAndFlushUnusedFiles(): void {
		if (!varmintWorkspaceManager.storage.initialized) {
			console.error(
				`💥 called flushGlobal, but the global cache wasn't initialized with startGlobalTracking`,
			)
			return
		}
		const dirContents = fs.readdirSync(varmintWorkspaceManager.storage.rootDir)
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
		fs.rmSync(varmintWorkspaceManager.storage.rootDir, { recursive: true })
	},
}

function startsWith<T extends string>(
	prefix: T,
	str: string,
): str is `${T}${string}` {
	return str.startsWith(prefix)
}
