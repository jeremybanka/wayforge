import { readdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import type { Scalar } from "yaml"
import { isMap, isScalar, isSeq, parseDocument } from "yaml"

import type { Release } from "./releases.ts"
import { compareVersions, latestRelease, parseVersion } from "./releases.ts"

export type UpgradeOptions = {
	/** Repository root. Defaults to the current working directory. */
	cwd?: string
	/** Resolve and report upgrades without writing files. */
	dryRun?: boolean
}

export type WorkflowUpdate = {
	filePath: string
	dependency: string
	kind: `action` | `mise`
	currentVersion: string
	currentRef: string
	targetVersion: string
	targetRef: string
	changed: boolean
}

export type UpgradeResult = {
	/** Absolute paths of files changed, or that would change in a dry run. */
	files: string[]
	updates: WorkflowUpdate[]
}

type Occurrence = {
	filePath: string
	dependency: string
	repository: string
	kind: `action` | `mise`
	currentRef: string
	currentVersion: string
	node: Scalar<string>
	suffix: string
	commentVersion: string | undefined
}

type Edit = { start: number; end: number; text: string }

const ACTION =
	/^([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)((?:\/[A-Za-z0-9_.-]+)*)@([^\s]+)$/
const SHA = /^[0-9a-f]{40}$/i

/** Upgrade GitHub Actions and pinned mise inputs to the latest stable releases. */
export async function upgradeWorkflows(
	options: UpgradeOptions = {},
): Promise<UpgradeResult> {
	const root = path.resolve(options.cwd ?? process.cwd())
	const files = await listWorkflowFiles(path.join(root, `.github`))
	const sources = new Map<string, string>()
	const occurrences: Occurrence[] = []
	for (const file of files) {
		const source = await readFile(file, `utf8`)
		sources.set(file, source)
		occurrences.push(...collectOccurrences(file, source))
	}

	const releases = new Map<string, Promise<Release>>()
	const updates = await Promise.all(
		occurrences.map(async (occurrence): Promise<WorkflowUpdate> => {
			let pending = releases.get(occurrence.repository)
			if (!pending) {
				pending = latestRelease(occurrence.repository)
				releases.set(occurrence.repository, pending)
			}
			const target = await pending
			const currentVersion = parseVersion(occurrence.currentVersion)!
			const targetVersion = parseVersion(target.version)!
			// A prerelease or a private mirror may already be ahead of stable tags.
			const canUpgrade = compareVersions(targetVersion, currentVersion) >= 0
			const targetRef = canUpgrade
				? occurrence.kind === `action`
					? target.commit
					: target.version
				: occurrence.currentRef
			const version = canUpgrade ? target.version : occurrence.currentVersion
			return {
				filePath: occurrence.filePath,
				dependency: occurrence.dependency,
				kind: occurrence.kind,
				currentVersion: occurrence.currentVersion,
				currentRef: occurrence.currentRef,
				targetVersion: version,
				targetRef,
				changed:
					targetRef !== occurrence.currentRef ||
					version !== occurrence.currentVersion,
			}
		}),
	)

	const edits = new Map<string, Edit[]>()
	for (const [index, occurrence] of occurrences.entries()) {
		const update = updates[index]!
		if (!update.changed) continue
		const fileEdits = edits.get(occurrence.filePath) ?? []
		const [start, end] = occurrence.node.range!
		const value =
			occurrence.kind === `action`
				? `${occurrence.dependency}@${update.targetRef}`
				: update.targetRef
		const quote =
			occurrence.node.type === `QUOTE_DOUBLE`
				? `"`
				: occurrence.node.type === `QUOTE_SINGLE`
					? `'`
					: ``
		fileEdits.push({ start, end, text: `${quote}${value}${quote}` })
		if (occurrence.kind === `action`) {
			const suffix = occurrence.suffix
			let comment: string
			if (occurrence.commentVersion) {
				comment = suffix.replace(/^(\s*#\s*)\S+/, `$1v${update.targetVersion}`)
			} else if (suffix.includes(`#`)) {
				comment = suffix.replace(/^(\s*#\s*)/, `$1v${update.targetVersion} `)
			} else {
				comment = ` # v${update.targetVersion}${suffix}`
			}
			fileEdits.push({ start: end, end: end + suffix.length, text: comment })
		}
		edits.set(occurrence.filePath, fileEdits)
	}

	const result: UpgradeResult = { files: [...edits.keys()], updates }
	if (options.dryRun) return result
	// Finish parsing and resolving every dependency before touching any file.
	// Also avoid overwriting edits made while the Git requests were running.
	for (const file of result.files) {
		if ((await readFile(file, `utf8`)) !== sources.get(file)) {
			throw new Error(`Workflow changed while resolving upgrades: ${file}`)
		}
	}
	for (const [file, fileEdits] of edits) {
		let source = sources.get(file)!
		fileEdits.sort((left, right) => right.start - left.start)
		for (const edit of fileEdits) {
			source = source.slice(0, edit.start) + edit.text + source.slice(edit.end)
		}
		await writeFile(file, source)
	}
	return result
}

async function listWorkflowFiles(github: string): Promise<string[]> {
	async function walk(directory: string): Promise<string[]> {
		const entries = await readdir(directory, { withFileTypes: true }).catch(
			(error: unknown) => {
				if (error instanceof Error && `code` in error && error.code === `ENOENT`)
					return []
				throw error
			},
		)
		const nested = await Promise.all(
			entries.map(async (entry): Promise<string[]> => {
				const file = path.join(directory, entry.name)
				if (entry.isDirectory()) return walk(file)
				if (!entry.isFile() || !/\.ya?ml$/.test(entry.name)) return []
				const relative = path.relative(github, file)
				return relative.startsWith(`workflows${path.sep}`) ||
					/^action\.ya?ml$/.test(entry.name)
					? [file]
					: []
			}),
		)
		return nested.flat()
	}
	return (await walk(github)).sort()
}

function collectOccurrences(filePath: string, source: string): Occurrence[] {
	const document = parseDocument(source)
	if (document.errors.length) {
		throw new Error(
			`Invalid workflow YAML in ${filePath}: ${document.errors[0]!.message}`,
		)
	}
	const root = document.contents
	if (!isMap(root)) return []
	const occurrences: Occurrence[] = []
	function collectStep(value: unknown): void {
		if (!isMap(value)) return
		const node = value.get(`uses`, true)
		if (!inlineString(node, source) || node.value.startsWith(`./`)) return
		const match = ACTION.exec(node.value)
		if (!match) return
		const repository = match[1]!
		const dependency = repository + match[2]!
		const currentRef = match[3]!
		const suffix = inlineSuffix(node, source)
		const commentToken = /^\s*#\s*(\S+)/.exec(suffix)?.[1]
		const commentVersion =
			commentToken && parseVersion(commentToken) ? commentToken : undefined
		// Branches, expressions, and unannotated SHAs are intentional custom pins.
		const currentVersion = SHA.test(currentRef)
			? commentVersion
			: parseVersion(currentRef)
				? currentRef
				: undefined
		if (currentVersion) {
			occurrences.push({
				filePath,
				repository,
				dependency,
				kind: `action`,
				currentRef,
				currentVersion: currentVersion.replace(/^v/, ``),
				node,
				suffix,
				commentVersion,
			})
		}
		if (dependency !== `jdx/mise-action`) return
		const inputs = value.get(`with`, true)
		const version = isMap(inputs) ? inputs.get(`version`, true) : undefined
		if (!inlineString(version, source)) return
		const parsed = parseVersion(version.value)
		if (parsed?.segments !== 3 || parsed.prerelease) return
		occurrences.push({
			filePath,
			repository: `jdx/mise`,
			dependency: `jdx/mise`,
			kind: `mise`,
			currentRef: version.value,
			currentVersion: version.value.replace(/^v/, ``),
			node: version,
			suffix: inlineSuffix(version, source),
			commentVersion: undefined,
		})
	}
	function collectSteps(value: unknown): void {
		if (isSeq(value)) for (const step of value.items) collectStep(step)
	}
	const jobs = root.get(`jobs`, true)
	if (isMap(jobs)) {
		for (const job of jobs.items) {
			collectStep(job.value)
			if (isMap(job.value)) collectSteps(job.value.get(`steps`, true))
		}
	}
	const runs = root.get(`runs`, true)
	if (isMap(runs) && runs.get(`using`) === `composite`)
		collectSteps(runs.get(`steps`, true))
	return occurrences
}

function inlineSuffix(node: Scalar, source: string): string {
	const end = node.range![1]
	const newline = source.indexOf(`\n`, end)
	return source
		.slice(end, newline < 0 ? source.length : newline)
		.replace(/\r$/, ``)
}

function inlineString(node: unknown, source: string): node is Scalar<string> {
	return (
		isScalar(node) &&
		typeof node.value === `string` &&
		Boolean(node.range) &&
		!node.anchor &&
		!node.tag &&
		[undefined, `PLAIN`, `QUOTE_DOUBLE`, `QUOTE_SINGLE`].includes(node.type) &&
		!/[\r\n]/.test(source.slice(node.range![0], node.range![1])) &&
		/^[\t ]*(?:#.*)?$/.test(inlineSuffix(node, source))
	)
}
