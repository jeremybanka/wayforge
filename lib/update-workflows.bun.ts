#!/usr/bin/env bun
import path from "node:path"
import { $ } from "bun"

type WorkflowUse = {
	filePath: string
	lineIndex: number
	prefix: string
	actionName: string
	currentRef: string
	currentVersion: string
	originalComment: string | null
}

type MiseVersionUse = {
	filePath: string
	lineIndex: number
	prefix: string
	currentVersion: string
}

type ActionGroup = {
	actionName: string
	currentVersion: string
	currentRef: string
	occurrences: WorkflowUse[]
}

type MiseVersionGroup = {
	depName: string
	currentVersion: string
	occurrences: MiseVersionUse[]
}

type ParsedVersion = {
	major: number
	minor: number
	patch: number
	prerelease: string | null
	segments: number
}

type ResolvedUpdate = {
	depName: string
	currentVersion: string
	currentRef: string
	currentShortRef: string
	targetVersion: string
	targetRef: string
	hasUpdate: boolean
}

type ResolvedMiseUpdate = {
	depName: string
	currentVersion: string
	targetVersion: string
	hasUpdate: boolean
}

type WorkflowInventory = {
	workflowUses: WorkflowUse[]
	miseVersionUses: MiseVersionUse[]
}

const SHA_PATTERN = /^[0-9a-f]{40}$/i
const USES_PATTERN =
	/^(?<prefix>\s*(?:-\s+)?uses:\s+)(?<action>[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)@(?<ref>[^\s#]+)(?:\s+#\s*(?<comment>[^\r\n]+))?\s*$/
const MISE_VERSION_PATTERN =
	/^(?<prefix>\s*version:\s+)(?<version>\d+\.\d+\.\d+)\s*$/
const ANSI = {
	reset: `\x1b[0m`,
	white: `\x1b[97m`,
	green: `\x1b[32m`,
	grey: `\x1b[90m`,
}

async function main(): Promise<void> {
	const isDryRun = process.argv.includes(`--dry-run`)
	const workspaceRoot = process.cwd()
	const workflowFiles = await listWorkflowFiles(workspaceRoot)
	const { workflowUses, miseVersionUses } =
		await collectWorkflowInventory(workflowFiles)

	if (workflowUses.length === 0 && miseVersionUses.length === 0) {
		console.log(`No external workflow dependencies found under .github`)
		return
	}

	const groups = groupWorkflowUses(workflowUses)
	const updates = await resolveUpdates(groups)
	const miseGroups = groupMiseVersionUses(miseVersionUses)
	const miseUpdates = await resolveMiseUpdates(miseGroups)

	for (const update of updates) {
		if (update.hasUpdate) {
			console.log(
				`${colorWhite(update.depName)} ${colorGreen(update.currentVersion)} ${colorGrey(`(${update.currentShortRef})`)} ${colorGrey(`->`)} ${colorGreen(update.targetVersion)} ${colorGrey(`(${shortSha(update.targetRef)})`)} ✨`,
			)
		} else {
			console.log(
				`${colorWhite(update.depName)} ${colorGreen(update.currentVersion)} ${colorGrey(`(${update.currentShortRef})`)}`,
			)
		}
	}

	for (const update of miseUpdates) {
		if (update.hasUpdate) {
			console.log(
				`${colorWhite(update.depName)} ${colorGreen(update.currentVersion)} ${colorGrey(`->`)} ${colorGreen(update.targetVersion)} ✨`,
			)
		} else {
			console.log(
				`${colorWhite(update.depName)} ${colorGreen(update.currentVersion)}`,
			)
		}
	}

	if (isDryRun) {
		console.log(`Dry run: no files updated`)
		return
	}

	const updatesByKey = new Map(
		updates.map((update) => [
			groupKey(update.depName, update.currentVersion),
			update,
		]),
	)
	const miseUpdatesByVersion = new Map(
		miseUpdates.map((update) => [update.currentVersion, update]),
	)
	const filesToWrite = new Map<string, string[]>()

	for (const workflowUse of workflowUses) {
		const update = updatesByKey.get(
			groupKey(workflowUse.actionName, workflowUse.currentVersion),
		)

		if (!update?.hasUpdate) {
			continue
		}

		const fileLines =
			filesToWrite.get(workflowUse.filePath) ??
			(await Bun.file(workflowUse.filePath).text()).split(/\r?\n/)
		fileLines[workflowUse.lineIndex] =
			`${workflowUse.prefix}${workflowUse.actionName}@${update.targetRef} # ${withVersionPrefix(update.targetVersion)}`
		filesToWrite.set(workflowUse.filePath, fileLines)
	}

	for (const miseVersionUse of miseVersionUses) {
		const update = miseUpdatesByVersion.get(miseVersionUse.currentVersion)

		if (!update?.hasUpdate) {
			continue
		}

		const fileLines =
			filesToWrite.get(miseVersionUse.filePath) ??
			(await Bun.file(miseVersionUse.filePath).text()).split(/\r?\n/)
		fileLines[miseVersionUse.lineIndex] =
			`${miseVersionUse.prefix}${update.targetVersion}`
		filesToWrite.set(miseVersionUse.filePath, fileLines)
	}

	for (const [filePath, fileLines] of filesToWrite) {
		await Bun.write(filePath, `${fileLines.join(`\n`)}\n`)
	}

	console.log(`Updated ${filesToWrite.size} file(s)`)
}

async function listWorkflowFiles(workspaceRoot: string): Promise<string[]> {
	const githubDir = path.join(workspaceRoot, `.github`)
	const command = $`rg --files ${githubDir}`.quiet()
	const output = await command.text()

	return output
		.split(`\n`)
		.map((line) => line.trim())
		.filter((line) => line.endsWith(`.yml`) || line.endsWith(`.yaml`))
		.sort((left, right) => left.localeCompare(right))
}

async function collectWorkflowInventory(
	filePaths: string[],
): Promise<WorkflowInventory> {
	const workflowUses: WorkflowUse[] = []
	const miseVersionUses: MiseVersionUse[] = []

	for (const filePath of filePaths) {
		const fileLines = (await Bun.file(filePath).text()).split(/\r?\n/)

		for (const [lineIndex, line] of fileLines.entries()) {
			const match = USES_PATTERN.exec(line)
			if (!match?.groups) {
				continue
			}

			const actionName = match.groups["action"]
			const prefix = match.groups["prefix"]
			const currentRef = match.groups["ref"]
			const originalComment = match.groups["comment"]?.trim() ?? null
			if (!actionName || !originalComment || !currentRef || !prefix) {
				continue
			}
			if (actionName.startsWith(`./`)) {
				continue
			}

			const currentVersion = normalizeVersion(originalComment ?? currentRef)

			workflowUses.push({
				filePath,
				lineIndex,
				prefix,
				actionName,
				currentRef,
				currentVersion,
				originalComment,
			})

			if (actionName === `jdx/mise-action`) {
				const miseVersionUse = findMiseVersionUse(filePath, fileLines, lineIndex)
				if (miseVersionUse) {
					miseVersionUses.push(miseVersionUse)
				}
			}
		}
	}

	return { workflowUses, miseVersionUses }
}

function groupWorkflowUses(workflowUses: WorkflowUse[]): ActionGroup[] {
	const groups = new Map<string, ActionGroup>()

	for (const workflowUse of workflowUses) {
		const key = groupKey(workflowUse.actionName, workflowUse.currentVersion)
		const existingGroup = groups.get(key)

		if (existingGroup) {
			existingGroup.occurrences.push(workflowUse)
			continue
		}

		groups.set(key, {
			actionName: workflowUse.actionName,
			currentVersion: workflowUse.currentVersion,
			currentRef: workflowUse.currentRef,
			occurrences: [workflowUse],
		})
	}

	return [...groups.values()].sort((left, right) =>
		left.actionName.localeCompare(right.actionName),
	)
}

function groupMiseVersionUses(
	miseVersionUses: MiseVersionUse[],
): MiseVersionGroup[] {
	const groups = new Map<string, MiseVersionGroup>()

	for (const miseVersionUse of miseVersionUses) {
		const existingGroup = groups.get(miseVersionUse.currentVersion)

		if (existingGroup) {
			existingGroup.occurrences.push(miseVersionUse)
			continue
		}

		groups.set(miseVersionUse.currentVersion, {
			depName: `jdx/mise`,
			currentVersion: miseVersionUse.currentVersion,
			occurrences: [miseVersionUse],
		})
	}

	return [...groups.values()].sort((left, right) =>
		compareVersionStrings(left.currentVersion, right.currentVersion),
	)
}

async function resolveUpdates(groups: ActionGroup[]): Promise<ResolvedUpdate[]> {
	const repoTagCache = new Map<string, string[]>()

	return Promise.all(
		groups.map(async (group) => {
			const [owner, repo] = group.actionName.split(`/`)
			const repository = `${owner}/${repo}`
			const availableTags = await getRepositoryTags(repository, repoTagCache)
			const targetTag = selectLatestTag(availableTags)

			if (!targetTag) {
				return {
					depName: group.actionName,
					currentVersion: group.currentVersion,
					currentRef: group.currentRef,
					currentShortRef: shortSha(group.currentRef),
					targetVersion: group.currentVersion,
					targetRef: group.currentRef,
					hasUpdate: false,
				}
			}

			const targetRef = await resolveTagCommit(repository, targetTag)
			const targetVersion = normalizeVersion(targetTag)
			const hasUpdate =
				group.currentRef !== targetRef || group.currentVersion !== targetVersion

			return {
				depName: group.actionName,
				currentVersion: group.currentVersion,
				currentRef: group.currentRef,
				currentShortRef: shortSha(group.currentRef),
				targetVersion,
				targetRef,
				hasUpdate,
			}
		}),
	)
}

async function resolveMiseUpdates(
	groups: MiseVersionGroup[],
): Promise<ResolvedMiseUpdate[]> {
	if (groups.length === 0) {
		return []
	}

	const availableTags = await getRepositoryTags(`jdx/mise`, new Map())
	const targetTag = selectLatestTag(availableTags)

	if (!targetTag) {
		return groups.map((group) => ({
			depName: group.depName,
			currentVersion: group.currentVersion,
			targetVersion: group.currentVersion,
			hasUpdate: false,
		}))
	}

	const targetVersion = normalizeVersion(targetTag)

	return groups.map((group) => ({
		depName: group.depName,
		currentVersion: group.currentVersion,
		targetVersion,
		hasUpdate: group.currentVersion !== targetVersion,
	}))
}

async function getRepositoryTags(
	repository: string,
	cache: Map<string, string[]>,
): Promise<string[]> {
	const cachedTags = cache.get(repository)
	if (cachedTags) {
		return cachedTags
	}

	const remote = `https://github.com/${repository}.git`
	const output = await $`git ls-remote --tags --refs ${remote}`.quiet().text()
	const tags = output
		.split(`\n`)
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => line.split(/\s+/)[1]?.replace(`refs/tags/`, ``) ?? ``)
		.filter(Boolean)

	cache.set(repository, tags)
	return tags
}

function selectLatestTag(tags: string[]): string | null {
	const parsedTags = tags
		.map((tag) => ({ tag, parsed: parseVersion(tag) }))
		.filter(
			(entry): entry is { tag: string; parsed: ParsedVersion } =>
				entry.parsed !== null,
		)
		.filter((entry) => entry.parsed.prerelease === null)

	if (parsedTags.length === 0) {
		return null
	}

	parsedTags.sort((left, right) => compareVersions(right.parsed, left.parsed))
	return parsedTags[0]?.tag ?? null
}

async function resolveTagCommit(
	repository: string,
	tag: string,
): Promise<string> {
	const remote = `https://github.com/${repository}.git`
	const peeledOutput = await $`git ls-remote ${remote} refs/tags/${tag}^{}`
		.quiet()
		.text()
	const peeledRef = peeledOutput.trim().split(/\s+/)[0]
	if (peeledRef) {
		return peeledRef
	}

	const directOutput = await $`git ls-remote ${remote} refs/tags/${tag}`
		.quiet()
		.text()
	const directRef = directOutput.trim().split(/\s+/)[0]
	if (!directRef) {
		throw new Error(`Unable to resolve ${repository}@${tag}`)
	}

	return directRef
}

function parseVersion(value: string): ParsedVersion | null {
	const normalized = normalizeVersion(value)
	const match =
		/^(?<major>\d+)(?:\.(?<minor>\d+))?(?:\.(?<patch>\d+))?(?:-(?<prerelease>[0-9A-Za-z.-]+))?$/.exec(
			normalized,
		)

	if (!match?.groups) {
		return null
	}

	const segments = normalized.split(`-`)[0]?.split(`.`).length ?? 0

	return {
		major: Number(match.groups["major"]),
		minor: Number(match.groups["minor"] ?? 0),
		patch: Number(match.groups["patch"] ?? 0),
		prerelease: match.groups["prerelease"] ?? null,
		segments,
	}
}

function compareVersions(left: ParsedVersion, right: ParsedVersion): number {
	if (left.major !== right.major) {
		return left.major - right.major
	}
	if (left.minor !== right.minor) {
		return left.minor - right.minor
	}
	if (left.patch !== right.patch) {
		return left.patch - right.patch
	}
	if (left.prerelease === null && right.prerelease !== null) {
		return 1
	}
	if (left.prerelease !== null && right.prerelease === null) {
		return -1
	}
	if (left.prerelease !== right.prerelease) {
		return (left.prerelease ?? ``).localeCompare(right.prerelease ?? ``)
	}
	return left.segments - right.segments
}

function normalizeVersion(value: string): string {
	return value.trim().replace(/^v/, ``)
}

function withVersionPrefix(value: string): string {
	return value.startsWith(`v`) ? value : `v${value}`
}

function shortSha(value: string): string {
	return SHA_PATTERN.test(value) ? value.slice(0, 8) : value
}

function groupKey(actionName: string, version: string): string {
	return `${actionName}@@${version}`
}

function findMiseVersionUse(
	filePath: string,
	fileLines: string[],
	actionLineIndex: number,
): MiseVersionUse | null {
	const actionLine = fileLines[actionLineIndex]
	if (!actionLine) {
		return null
	}

	const actionIndent = leadingWhitespace(actionLine).length

	for (
		let lineIndex = actionLineIndex + 1;
		lineIndex < fileLines.length;
		lineIndex += 1
	) {
		const line = fileLines[lineIndex] ?? ``
		const trimmedLine = line.trim()

		if (trimmedLine.length === 0) {
			continue
		}

		const currentIndent = leadingWhitespace(line).length
		if (currentIndent <= actionIndent) {
			return null
		}

		const versionMatch = MISE_VERSION_PATTERN.exec(line)

		if (versionMatch?.groups) {
			const prefix = versionMatch.groups["prefix"]
			if (!prefix) {
				return null
			}
			const currentVersion = versionMatch.groups["version"]
			if (!currentVersion) {
				return null
			}
			return {
				filePath,
				lineIndex,
				prefix,
				currentVersion,
			}
		}
	}

	return null
}

function compareVersionStrings(left: string, right: string): number {
	const leftVersion = parseVersion(left)
	const rightVersion = parseVersion(right)

	if (leftVersion && rightVersion) {
		return compareVersions(leftVersion, rightVersion)
	}

	return left.localeCompare(right)
}

function leadingWhitespace(value: string): string {
	return value.match(/^\s*/)?.[0] ?? ``
}

function colorWhite(value: string): string {
	return colorize(ANSI.white, value)
}

function colorGreen(value: string): string {
	return colorize(ANSI.green, value)
}

function colorGrey(value: string): string {
	return colorize(ANSI.grey, value)
}

function colorize(color: string, value: string): string {
	if (process.env["NO_COLOR"]) {
		return value
	}

	return `${color}${value}${ANSI.reset}`
}

await main()
