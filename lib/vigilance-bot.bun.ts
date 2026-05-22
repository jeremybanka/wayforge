#!/usr/bin/env bun
import { spawn } from "node:child_process"
import { createHash } from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"

type CommandResult = {
	exitCode: number | null
	stderr: string
	stdout: string
	timedOut: boolean
}

type PackageJson = {
	name?: string
	packageManager?: string
	private?: boolean
	publishConfig?: { access?: string }
	version?: string
	workspaces?: string[]
}

type WorkspacePackage = {
	importerPath: string
	name: string
	packageJsonPath: string
	version: string
}

type PublishedPackage = WorkspacePackage & {
	latestPublishedVersion: string
}

type LockDependencyEntry =
	| string
	| {
			specifier?: string
			version?: string
	  }

type LockDependencyMap = Record<string, LockDependencyEntry>

type LockImporter = {
	dependencies?: LockDependencyMap
	optionalDependencies?: LockDependencyMap
}

type LockSnapshot = {
	dependencies?: Record<string, string>
	optionalDependencies?: Record<string, string>
}

type PnpmLockfile = {
	importers?: Record<string, LockImporter>
	packages?: Record<string, unknown>
	snapshots?: Record<string, LockSnapshot>
}

type PackageGraph = {
	lockfile: PnpmLockfile
	workspacePackagesByImporterPath: Map<string, WorkspacePackage>
	workspacePackagesByName: Map<string, WorkspacePackage>
}

type AuditIssue = {
	affectedTopPackages: Set<string>
	id: string
	packageName: string
	severity: string
	title: string | null
	url: string | null
	vulnerableVersions: Set<string>
}

type Finding = {
	vulnerableLastPublishedVersion: string
	currentSafeDependencyVersion: string | null
	ourPackagesUpgradedBetweenTheseTwoVersions: string[]
	issuesAddressed: string[]
}

type FindingDraft = Finding & {
	issueKeys: Set<string>
}

type CliOptions = {
	dryRun: boolean
	json: boolean
	testbedPath: string | null
}

const GENERATED_CHANGESET_PREFIX = `vigilance-bot-`
const HIGH_IMPACT_SEVERITIES = new Set([`high`, `critical`])
const PRODUCTION_DEPENDENCY_FIELDS = [
	`dependencies`,
	`optionalDependencies`,
] as const
const ROOT_IMPORTER_PATH = `.`

async function main(): Promise<void> {
	const options = parseCliOptions(process.argv.slice(2))
	const workspaceRoot = process.cwd()
	const rootPackageJson = await readPackageJson(
		path.join(workspaceRoot, `package.json`),
	)
	const workspacePackages = await collectWorkspacePackages(workspaceRoot)
	const publishedPackages = await collectPublishedPackages(
		workspaceRoot,
		workspacePackages,
	)

	if (publishedPackages.length === 0) {
		console.log(`No npm-published workspace packages were visible from npm.`)
		if (!options.dryRun) {
			await clearGeneratedChangesets(workspaceRoot)
		}
		return
	}

	const testbedPath =
		options.testbedPath ??
		path.resolve(
			workspaceRoot,
			`..`,
			`${path.basename(workspaceRoot)}-vigilance-testbed`,
		)

	await prepareTestbed(testbedPath, rootPackageJson, publishedPackages)

	console.log(
		`Auditing ${publishedPackages.length} npm-published package(s) in ${testbedPath}`,
	)
	const publishedAuditReport = await runAudit(testbedPath)
	const currentAuditReport = await runAudit(workspaceRoot)
	const packageNames = new Set(publishedPackages.map((pkg) => pkg.name))
	const publishedIssues = parseAuditIssues(publishedAuditReport, packageNames)
	const currentIssues = parseAuditIssues(currentAuditReport, packageNames)

	const publishedGraph = await readPackageGraph(testbedPath, [])
	const currentGraph = await readPackageGraph(workspaceRoot, workspacePackages)
	const findings = buildFindings({
		currentGraph,
		currentIssues,
		publishedGraph,
		publishedIssues,
		publishedPackages,
	})

	if (options.json) {
		console.log(JSON.stringify(findings, null, `\t`))
	}

	if (findings.length === 0) {
		console.log(
			`No stale high or critical production vulnerabilities were found in published packages.`,
		)
		if (!options.dryRun) {
			await clearGeneratedChangesets(workspaceRoot)
		}
		return
	}

	console.log(`Found ${findings.length} security release finding(s).`)

	if (options.dryRun) {
		for (const finding of findings) {
			console.log(formatFindingSummary(finding))
		}
		return
	}

	await writeChangesets(workspaceRoot, findings)
}

function parseCliOptions(args: string[]): CliOptions {
	const options: CliOptions = {
		dryRun: false,
		json: false,
		testbedPath: null,
	}

	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index]

		if (arg === `--dry-run`) {
			options.dryRun = true
			continue
		}
		if (arg === `--json`) {
			options.json = true
			continue
		}
		if (arg === `--testbed`) {
			const value = args[index + 1]
			if (!value) {
				throw new Error(`Missing value after --testbed`)
			}
			options.testbedPath = path.resolve(value)
			index += 1
			continue
		}

		throw new Error(`Unknown argument: ${arg}`)
	}

	return options
}

async function collectWorkspacePackages(
	workspaceRoot: string,
): Promise<WorkspacePackage[]> {
	const rootPackageJson = await readPackageJson(
		path.join(workspaceRoot, `package.json`),
	)
	const workspacePatterns = rootPackageJson.workspaces ?? []
	const packages: WorkspacePackage[] = []

	for (const pattern of workspacePatterns) {
		if (!pattern.endsWith(`/*`)) {
			continue
		}

		const parentDir = pattern.slice(0, -2)
		const absoluteParentDir = path.join(workspaceRoot, parentDir)
		const entries = await safeReadDir(absoluteParentDir)

		for (const entry of entries) {
			if (!entry.isDirectory()) {
				continue
			}

			const importerPath = path.posix.join(parentDir, entry.name)
			const packageJsonPath = path.join(
				workspaceRoot,
				importerPath,
				`package.json`,
			)
			const packageJson = await readPackageJson(packageJsonPath)
			if (!packageJson.name || !packageJson.version || packageJson.private) {
				continue
			}

			packages.push({
				importerPath,
				name: packageJson.name,
				packageJsonPath,
				version: packageJson.version,
			})
		}
	}

	return packages.sort((left, right) => left.name.localeCompare(right.name))
}

async function collectPublishedPackages(
	workspaceRoot: string,
	workspacePackages: WorkspacePackage[],
): Promise<PublishedPackage[]> {
	const publishedPackages = await Promise.all(
		workspacePackages.map((workspacePackage) =>
			resolvePublishedPackage(workspaceRoot, workspacePackage),
		),
	)

	return publishedPackages
		.filter((pkg): pkg is PublishedPackage => Boolean(pkg))
		.sort((left, right) => left.name.localeCompare(right.name))
}

async function resolvePublishedPackage(
	workspaceRoot: string,
	workspacePackage: WorkspacePackage,
): Promise<PublishedPackage | null> {
	const result = await runCommand(
		`pnpm`,
		[`view`, workspacePackage.name, `version`, `--json`],
		workspaceRoot,
		{ allowFailure: true, timeoutMs: 30_000 },
	)

	if (result.timedOut) {
		throw new Error(`npm view timed out for ${workspacePackage.name}.`)
	}
	if (result.exitCode !== 0) {
		if (isMissingNpmPackage(result)) {
			console.log(`Skipping ${workspacePackage.name}: not visible on npm.`)
			return null
		}

		throw new Error(
			[
				`Unable to query npm for ${workspacePackage.name}.`,
				result.stdout.trim(),
				result.stderr.trim(),
			]
				.filter(Boolean)
				.join(`\n`),
		)
	}

	const latestPublishedVersion = parsePnpmViewVersion(result.stdout)
	if (!latestPublishedVersion) {
		console.log(`Skipping ${workspacePackage.name}: npm returned no version.`)
		return null
	}

	return {
		...workspacePackage,
		latestPublishedVersion,
	}
}

async function prepareTestbed(
	testbedPath: string,
	rootPackageJson: PackageJson,
	publishedPackages: PublishedPackage[],
): Promise<void> {
	await fs.rm(testbedPath, { force: true, recursive: true })
	await fs.mkdir(testbedPath, { recursive: true })
	const dependencies = Object.fromEntries(
		publishedPackages.map((pkg) => [pkg.name, `latest`]),
	)
	const packageJson = {
		name: `wayforge-vigilance-testbed`,
		private: true,
		packageManager: rootPackageJson.packageManager,
		dependencies,
	}

	await fs.writeFile(
		path.join(testbedPath, `package.json`),
		`${JSON.stringify(packageJson, null, `\t`)}\n`,
	)
	await runCommand(
		`pnpm`,
		[`install`, `--ignore-scripts`, `--prod`],
		testbedPath,
		{ timeoutMs: 5 * 60_000 },
	)
}

async function runAudit(cwd: string): Promise<unknown> {
	const result = await runCommand(
		`pnpm`,
		[`audit`, `--prod`, `--audit-level`, `high`, `--json`],
		cwd,
		{ allowFailure: true, timeoutMs: 2 * 60_000 },
	)

	if (!result.stdout.trim()) {
		if (result.exitCode === 0) {
			return {}
		}
		throw new Error(
			`pnpm audit did not return JSON in ${cwd}:\n${result.stderr.trim()}`,
		)
	}

	return parseJson(result.stdout, `pnpm audit output from ${cwd}`)
}

async function readPackageGraph(
	root: string,
	workspacePackages: WorkspacePackage[],
): Promise<PackageGraph> {
	const lockfilePath = path.join(root, `pnpm-lock.yaml`)
	const lockfileText = await fs.readFile(lockfilePath, `utf8`)
	const lockfile = parseYaml(lockfileText) as PnpmLockfile

	return {
		lockfile,
		workspacePackagesByImporterPath: new Map(
			workspacePackages.map((pkg) => [pkg.importerPath, pkg]),
		),
		workspacePackagesByName: new Map(
			workspacePackages.map((pkg) => [pkg.name, pkg]),
		),
	}
}

function buildFindings(input: {
	currentGraph: PackageGraph
	currentIssues: AuditIssue[]
	publishedGraph: PackageGraph
	publishedIssues: AuditIssue[]
	publishedPackages: PublishedPackage[]
}): Finding[] {
	const currentIssuesByKey = new Map(
		input.currentIssues.map((issue) => [issueKey(issue), issue]),
	)
	const publishedPackagesByName = new Map(
		input.publishedPackages.map((pkg) => [pkg.name, pkg]),
	)
	const findingDrafts = new Map<string, FindingDraft>()

	for (const issue of input.publishedIssues) {
		const affectedPackages =
			issue.affectedTopPackages.size > 0
				? [...issue.affectedTopPackages].filter((pkgName) =>
						publishedPackagesByName.has(pkgName),
					)
				: input.publishedPackages
						.filter((pkg) =>
							packageGraphContains(
								input.publishedGraph,
								ROOT_IMPORTER_PATH,
								pkg.name,
								issue.packageName,
							),
						)
						.map((pkg) => pkg.name)

		for (const packageName of affectedPackages) {
			const publishedVersions = collectPackageVersions(
				input.publishedGraph,
				ROOT_IMPORTER_PATH,
				packageName,
				issue.packageName,
			)
			const vulnerablePublishedVersions =
				issue.vulnerableVersions.size === 0
					? publishedVersions
					: setIntersection(publishedVersions, issue.vulnerableVersions)

			if (vulnerablePublishedVersions.size === 0) {
				continue
			}

			const workspacePackage =
				input.currentGraph.workspacePackagesByName.get(packageName)
			if (!workspacePackage) {
				continue
			}

			const currentIssue = currentIssuesByKey.get(issueKey(issue))
			const isStillAffected =
				currentIssue &&
				(currentIssue.affectedTopPackages.size === 0 ||
					currentIssue.affectedTopPackages.has(packageName))

			if (isStillAffected) {
				continue
			}

			const currentVersions = collectPackageVersions(
				input.currentGraph,
				workspacePackage.importerPath,
				packageName,
				issue.packageName,
			)
			const vulnerableLastPublishedVersion = formatVersionSet(
				vulnerablePublishedVersions,
			)
			const currentSafeDependencyVersion =
				currentVersions.size > 0 ? formatVersionSet(currentVersions) : null

			if (currentSafeDependencyVersion === vulnerableLastPublishedVersion) {
				continue
			}

			const issuesAddressed = [formatIssue(issue)]
			const key = [
				vulnerableLastPublishedVersion,
				currentSafeDependencyVersion ?? `absent`,
				packageName,
			].join(`\0`)
			const existingDraft = findingDrafts.get(key)

			if (existingDraft) {
				const keyForIssue = issueKey(issue)
				if (!existingDraft.issueKeys.has(keyForIssue)) {
					existingDraft.issueKeys.add(keyForIssue)
					existingDraft.issuesAddressed.push(...issuesAddressed)
				}
				continue
			}

			findingDrafts.set(key, {
				vulnerableLastPublishedVersion,
				currentSafeDependencyVersion,
				ourPackagesUpgradedBetweenTheseTwoVersions: [packageName],
				issuesAddressed,
				issueKeys: new Set([issueKey(issue)]),
			})
		}
	}

	return mergeCompatibleFindings([...findingDrafts.values()]).map(
		({ issueKeys: _issueKeys, ...finding }) => finding,
	)
}

function mergeCompatibleFindings(findings: FindingDraft[]): FindingDraft[] {
	const mergedFindings = new Map<string, FindingDraft>()

	for (const finding of findings) {
		const key = [
			finding.vulnerableLastPublishedVersion,
			finding.currentSafeDependencyVersion ?? `absent`,
			[...finding.issueKeys].sort().join(`\0`),
		].join(`\0`)
		const existingFinding = mergedFindings.get(key)

		if (existingFinding) {
			existingFinding.ourPackagesUpgradedBetweenTheseTwoVersions.push(
				...finding.ourPackagesUpgradedBetweenTheseTwoVersions,
			)
			continue
		}

		mergedFindings.set(key, {
			...finding,
			ourPackagesUpgradedBetweenTheseTwoVersions: [
				...finding.ourPackagesUpgradedBetweenTheseTwoVersions,
			],
		})
	}

	return [...mergedFindings.values()].map((finding) => ({
		...finding,
		issuesAddressed: [...new Set(finding.issuesAddressed)].sort((left, right) =>
			left.localeCompare(right),
		),
		ourPackagesUpgradedBetweenTheseTwoVersions: [
			...new Set(finding.ourPackagesUpgradedBetweenTheseTwoVersions),
		].sort((left, right) => left.localeCompare(right)),
	}))
}

function parseAuditIssues(
	auditReport: unknown,
	ourPackageNames: Set<string>,
): AuditIssue[] {
	const report = asRecord(auditReport)
	const issues = new Map<string, AuditIssue>()
	const advisories = asRecord(report[`advisories`])

	for (const [advisoryId, advisoryValue] of Object.entries(advisories)) {
		const advisory = asRecord(advisoryValue)
		const severity = getString(advisory[`severity`])?.toLowerCase()
		const packageName =
			getString(advisory[`module_name`]) ??
			getString(advisory[`moduleName`]) ??
			getString(advisory[`name`])

		if (!severity || !packageName || !HIGH_IMPACT_SEVERITIES.has(severity)) {
			continue
		}

		const issue = upsertIssue(issues, {
			id: uniqueStrings([
				getString(advisory[`github_advisory_id`]),
				getString(advisory[`id`]),
				advisoryId,
				...getStringArray(advisory[`cves`]),
			]).join(`, `),
			packageName,
			severity,
			title: getString(advisory[`title`]),
			url: getString(advisory[`url`]),
		})

		for (const version of collectFindingVersions(advisory)) {
			issue.vulnerableVersions.add(version)
		}
		for (const auditPath of collectFindingPaths(advisory)) {
			addAffectedTopPackage(issue, auditPath, ourPackageNames)
		}
	}

	const actions = Array.isArray(report[`actions`]) ? report[`actions`] : []
	for (const actionValue of actions) {
		const action = asRecord(actionValue)
		const resolves = Array.isArray(action[`resolves`]) ? action[`resolves`] : []

		for (const resolveValue of resolves) {
			const resolve = asRecord(resolveValue)
			const advisoryId = getString(resolve[`id`])
			const auditPath = getString(resolve[`path`])
			if (!advisoryId || !auditPath) {
				continue
			}

			for (const issue of issues.values()) {
				if (issue.id.includes(advisoryId)) {
					addAffectedTopPackage(issue, auditPath, ourPackageNames)
				}
			}
		}
	}

	const vulnerabilities = asRecord(report[`vulnerabilities`])
	for (const [packageName, vulnerabilityValue] of Object.entries(
		vulnerabilities,
	)) {
		const vulnerability = asRecord(vulnerabilityValue)
		const severity = getString(vulnerability[`severity`])?.toLowerCase()
		if (!severity || !HIGH_IMPACT_SEVERITIES.has(severity)) {
			continue
		}

		const vias = Array.isArray(vulnerability[`via`]) ? vulnerability[`via`] : []
		const advisoryVias = vias
			.map((via) => asNullableRecord(via))
			.filter((via): via is Record<string, unknown> => Boolean(via))

		if (advisoryVias.length === 0) {
			upsertIssue(issues, {
				id: packageName,
				packageName,
				severity,
				title: null,
				url: null,
			})
			continue
		}

		for (const via of advisoryVias) {
			const viaSeverity = getString(via[`severity`])?.toLowerCase() ?? severity
			if (!HIGH_IMPACT_SEVERITIES.has(viaSeverity)) {
				continue
			}

			upsertIssue(issues, {
				id:
					getString(via[`github_advisory_id`]) ??
					getString(via[`source`]) ??
					getString(via[`id`]) ??
					getString(via[`url`]) ??
					packageName,
				packageName,
				severity: viaSeverity,
				title: getString(via[`title`]),
				url: getString(via[`url`]),
			})
		}
	}

	return [...issues.values()].sort((left, right) =>
		issueKey(left).localeCompare(issueKey(right)),
	)
}

function upsertIssue(
	issues: Map<string, AuditIssue>,
	input: {
		id: string
		packageName: string
		severity: string
		title: string | null
		url: string | null
	},
): AuditIssue {
	const key = `${input.packageName}:${input.id}`
	const existingIssue = issues.get(key)
	if (existingIssue) {
		return existingIssue
	}

	const issue: AuditIssue = {
		...input,
		affectedTopPackages: new Set(),
		vulnerableVersions: new Set(),
	}
	issues.set(key, issue)
	return issue
}

function collectFindingVersions(advisory: Record<string, unknown>): string[] {
	const versions: string[] = []
	const findings = Array.isArray(advisory[`findings`])
		? advisory[`findings`]
		: []

	for (const findingValue of findings) {
		const finding = asRecord(findingValue)
		const version = getString(finding[`version`])
		if (version) {
			versions.push(version)
		}
	}

	return versions
}

function collectFindingPaths(advisory: Record<string, unknown>): string[] {
	const paths: string[] = []
	const findings = Array.isArray(advisory[`findings`])
		? advisory[`findings`]
		: []

	for (const findingValue of findings) {
		const finding = asRecord(findingValue)
		paths.push(...getStringArray(finding[`paths`]))
	}

	return paths
}

function addAffectedTopPackage(
	issue: AuditIssue,
	auditPath: string,
	ourPackageNames: Set<string>,
): void {
	const packageName = findTopPackageName(auditPath, ourPackageNames)
	if (packageName) {
		issue.affectedTopPackages.add(packageName)
	}
}

function findTopPackageName(
	auditPath: string,
	ourPackageNames: Set<string>,
): string | null {
	const packageNames = [...ourPackageNames].sort(
		(left, right) => right.length - left.length,
	)
	const pathSegments = auditPath
		.split(`>`)
		.map((segment) => segment.trim())
		.filter(Boolean)

	for (const segment of pathSegments) {
		const packageName = normalizeAuditPathSegment(segment)
		if (packageName && ourPackageNames.has(packageName)) {
			return packageName
		}
	}

	for (const packageName of packageNames) {
		if (
			auditPath === packageName ||
			auditPath.startsWith(`${packageName}>`) ||
			auditPath.includes(`node_modules/${packageName}/`)
		) {
			return packageName
		}
	}

	return null
}

function normalizeAuditPathSegment(segment: string): string | null {
	const nodeModulesIndex = segment.lastIndexOf(`node_modules/`)
	const packageSegment =
		nodeModulesIndex === -1
			? segment
			: segment.slice(nodeModulesIndex + `node_modules/`.length)
	const pathParts = packageSegment.split(`/`)
	const packageName = packageSegment.startsWith(`@`)
		? pathParts.slice(0, 2).join(`/`)
		: pathParts[0]

	if (!packageName) {
		return null
	}

	return stripVersionSuffix(packageName)
}

function stripVersionSuffix(packageName: string): string {
	const separatorIndex = packageName.startsWith(`@`)
		? packageName.indexOf(`@`, packageName.indexOf(`/`) + 1)
		: packageName.indexOf(`@`)

	return separatorIndex === -1
		? packageName
		: packageName.slice(0, separatorIndex)
}

function packageGraphContains(
	graph: PackageGraph,
	importerPath: string,
	topPackageName: string,
	targetPackageName: string,
): boolean {
	return (
		collectPackageVersions(
			graph,
			importerPath,
			topPackageName,
			targetPackageName,
		).size > 0
	)
}

function collectPackageVersions(
	graph: PackageGraph,
	importerPath: string,
	topPackageName: string,
	targetPackageName: string,
): Set<string> {
	const versions = new Set<string>()
	const importer = graph.lockfile.importers?.[importerPath]
	if (!importer) {
		return versions
	}

	if (topPackageName === targetPackageName) {
		const workspacePackage = graph.workspacePackagesByName.get(topPackageName)
		if (workspacePackage) {
			versions.add(workspacePackage.version)
		}
	}

	for (const [dependencyName, dependencyEntry] of productionDependencies(
		importer,
	)) {
		const startsFromTestbedRoot = importerPath === ROOT_IMPORTER_PATH
		if (startsFromTestbedRoot && dependencyName !== topPackageName) {
			continue
		}

		traverseDependency({
			dependencyName,
			graph,
			importerPath,
			targetPackageName,
			versions,
			visited: new Set(),
			version: dependencyVersion(dependencyEntry),
		})
	}

	return versions
}

function traverseDependency(input: {
	dependencyName: string
	graph: PackageGraph
	importerPath: string
	targetPackageName: string
	version: string | null
	versions: Set<string>
	visited: Set<string>
}): void {
	if (!input.version) {
		return
	}

	if (input.version.startsWith(`link:`)) {
		const linkedImporterPath = resolveLinkedImporterPath(
			input.importerPath,
			input.version,
		)
		const workspacePackage =
			input.graph.workspacePackagesByImporterPath.get(linkedImporterPath)

		if (!workspacePackage) {
			return
		}

		const visitKey = `workspace:${workspacePackage.importerPath}`
		if (input.visited.has(visitKey)) {
			return
		}
		input.visited.add(visitKey)

		if (workspacePackage.name === input.targetPackageName) {
			input.versions.add(workspacePackage.version)
		}

		const importer =
			input.graph.lockfile.importers?.[workspacePackage.importerPath]
		if (!importer) {
			return
		}

		for (const [childName, childEntry] of productionDependencies(importer)) {
			traverseDependency({
				dependencyName: childName,
				graph: input.graph,
				importerPath: workspacePackage.importerPath,
				targetPackageName: input.targetPackageName,
				version: dependencyVersion(childEntry),
				versions: input.versions,
				visited: input.visited,
			})
		}
		return
	}

	const packageKey = packageKeyForDependency(input.dependencyName, input.version)
	const packageInfo = parsePackageKey(packageKey)
	if (!packageInfo) {
		return
	}

	const visitKey = `registry:${packageKey}`
	if (input.visited.has(visitKey)) {
		return
	}
	input.visited.add(visitKey)

	if (packageInfo.name === input.targetPackageName) {
		input.versions.add(packageInfo.version)
	}

	const snapshot =
		input.graph.lockfile.snapshots?.[packageKey] ??
		(input.graph.lockfile.packages?.[packageKey] as LockSnapshot | undefined)
	if (!snapshot) {
		return
	}

	for (const [childName, childVersion] of snapshotDependencies(snapshot)) {
		traverseDependency({
			dependencyName: childName,
			graph: input.graph,
			importerPath: input.importerPath,
			targetPackageName: input.targetPackageName,
			version: childVersion,
			versions: input.versions,
			visited: input.visited,
		})
	}
}

function productionDependencies(
	importer: LockImporter,
): [string, LockDependencyEntry][] {
	const dependencies: [string, LockDependencyEntry][] = []

	for (const field of PRODUCTION_DEPENDENCY_FIELDS) {
		dependencies.push(...Object.entries(importer[field] ?? {}))
	}

	return dependencies
}

function snapshotDependencies(snapshot: LockSnapshot): [string, string][] {
	const dependencies: [string, string][] = []

	for (const field of PRODUCTION_DEPENDENCY_FIELDS) {
		dependencies.push(...Object.entries(snapshot[field] ?? {}))
	}

	return dependencies
}

function dependencyVersion(entry: LockDependencyEntry): string | null {
	if (typeof entry === `string`) {
		return entry
	}

	return entry.version ?? null
}

function resolveLinkedImporterPath(
	importerPath: string,
	version: string,
): string {
	const linkTarget = version.slice(`link:`.length)
	const importerDir = importerPath === ROOT_IMPORTER_PATH ? `` : importerPath
	const resolved = path.posix.normalize(path.posix.join(importerDir, linkTarget))
	return resolved === `` ? ROOT_IMPORTER_PATH : resolved
}

function packageKeyForDependency(
	dependencyName: string,
	version: string,
): string {
	if (version.startsWith(`npm:`)) {
		return version.slice(`npm:`.length)
	}

	if (parsePackageKey(version)) {
		return version
	}

	return `${dependencyName}@${version}`
}

function parsePackageKey(
	packageKey: string,
): { name: string; version: string } | null {
	const barePackageKey = packageKey.replace(/^\//, ``).split(`(`)[0]
	const separatorIndex = barePackageKey.lastIndexOf(`@`)
	if (separatorIndex <= 0) {
		return null
	}

	return {
		name: barePackageKey.slice(0, separatorIndex),
		version: barePackageKey.slice(separatorIndex + 1),
	}
}

async function writeChangesets(
	workspaceRoot: string,
	findings: Finding[],
): Promise<void> {
	await clearGeneratedChangesets(workspaceRoot)
	const changesetDir = path.join(workspaceRoot, `.changeset`)
	await fs.mkdir(changesetDir, { recursive: true })
	const findingsByPackageSet = new Map<string, Finding[]>()

	for (const finding of findings) {
		const packageKey = finding.ourPackagesUpgradedBetweenTheseTwoVersions
			.slice()
			.sort((left, right) => left.localeCompare(right))
			.join(`\0`)
		const packageFindings = findingsByPackageSet.get(packageKey) ?? []
		packageFindings.push(finding)
		findingsByPackageSet.set(packageKey, packageFindings)
	}

	for (const findingsForPackages of findingsByPackageSet.values()) {
		const packageNames =
			findingsForPackages[0]?.ourPackagesUpgradedBetweenTheseTwoVersions ?? []
		const filename = `${GENERATED_CHANGESET_PREFIX}${hashForChangeset(
			packageNames,
			findingsForPackages,
		)}.md`
		await fs.writeFile(
			path.join(changesetDir, filename),
			renderChangeset(packageNames, findingsForPackages),
		)
	}
}

async function clearGeneratedChangesets(workspaceRoot: string): Promise<void> {
	const changesetDir = path.join(workspaceRoot, `.changeset`)
	const entries = await safeReadDir(changesetDir)

	await Promise.all(
		entries
			.filter(
				(entry) =>
					entry.isFile() &&
					entry.name.startsWith(GENERATED_CHANGESET_PREFIX) &&
					entry.name.endsWith(`.md`),
			)
			.map((entry) => fs.rm(path.join(changesetDir, entry.name))),
	)
}

function renderChangeset(packageNames: string[], findings: Finding[]): string {
	const frontmatter = packageNames
		.slice()
		.sort((left, right) => left.localeCompare(right))
		.map((packageName) => `${JSON.stringify(packageName)}: patch`)
		.join(`\n`)
	const bodyLines = [
		`Release a patched production dependency graph for high and critical advisories that were still present in the latest npm-published packages.`,
		``,
	]

	for (const finding of findings) {
		const currentVersionText =
			finding.currentSafeDependencyVersion ?? `not present in the current graph`
		bodyLines.push(
			`- ${finding.issuesAddressed.join(`; `)}. Published packages resolved ${finding.vulnerableLastPublishedVersion}; the current workspace resolves ${currentVersionText}.`,
		)
	}

	return `---\n${frontmatter}\n---\n\n${bodyLines.join(`\n`)}\n`
}

function hashForChangeset(packageNames: string[], findings: Finding[]): string {
	return createHash(`sha256`)
		.update(JSON.stringify({ findings, packageNames }))
		.digest(`hex`)
		.slice(0, 12)
}

function formatFindingSummary(finding: Finding): string {
	const packages = finding.ourPackagesUpgradedBetweenTheseTwoVersions.join(`, `)
	const current =
		finding.currentSafeDependencyVersion ?? `not present in current graph`
	return `${packages}: ${finding.vulnerableLastPublishedVersion} -> ${current} (${finding.issuesAddressed.join(`; `)})`
}

function formatIssue(issue: AuditIssue): string {
	const title = issue.title ? `: ${issue.title}` : ``
	const url = issue.url ? ` (${issue.url})` : ``
	return `${issue.severity} ${issue.id} in ${issue.packageName}${title}${url}`
}

function issueKey(issue: AuditIssue): string {
	return `${issue.packageName}:${issue.id}`
}

function setIntersection(left: Set<string>, right: Set<string>): Set<string> {
	const values = new Set<string>()

	for (const value of left) {
		if (right.has(value)) {
			values.add(value)
		}
	}

	return values
}

function formatVersionSet(versions: Set<string>): string {
	return [...versions]
		.sort((left, right) => left.localeCompare(right))
		.join(`, `)
}

async function readPackageJson(filePath: string): Promise<PackageJson> {
	return parseJson(await fs.readFile(filePath, `utf8`), filePath) as PackageJson
}

async function safeReadDir(
	filePath: string,
): Promise<import("node:fs").Dirent[]> {
	try {
		return await fs.readdir(filePath, { withFileTypes: true })
	} catch (error) {
		if (isNodeError(error) && error.code === `ENOENT`) {
			return []
		}
		throw error
	}
}

function parsePnpmViewVersion(stdout: string): string | null {
	const trimmedStdout = stdout.trim()
	if (!trimmedStdout) {
		return null
	}

	const parsed = parseJson(trimmedStdout, `pnpm view version`)
	return typeof parsed === `string` ? parsed : null
}

function isMissingNpmPackage(result: CommandResult): boolean {
	const output = `${result.stdout}\n${result.stderr}`
	return (
		output.includes(`ERR_PNPM_FETCH_404`) ||
		output.includes(`404 Not Found`) ||
		output.includes(`is not in this registry`)
	)
}

function parseJson(text: string, label: string): unknown {
	try {
		return JSON.parse(text)
	} catch (error) {
		throw new Error(`Unable to parse ${label}: ${(error as Error).message}`)
	}
}

function parseYaml(text: string): unknown {
	return (
		Bun as unknown as { YAML: { parse(input: string): unknown } }
	).YAML.parse(text)
}

function asRecord(value: unknown): Record<string, unknown> {
	return asNullableRecord(value) ?? {}
}

function asNullableRecord(value: unknown): Record<string, unknown> | null {
	return value && typeof value === `object` && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null
}

function getString(value: unknown): string | null {
	if (typeof value === `string`) {
		return value
	}
	if (typeof value === `number`) {
		return String(value)
	}
	return null
}

function getStringArray(value: unknown): string[] {
	return Array.isArray(value)
		? value.filter((item): item is string => typeof item === `string`)
		: []
}

function uniqueStrings(values: (string | null)[]): string[] {
	return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
	return error instanceof Error && `code` in error
}

async function runCommand(
	command: string,
	args: string[],
	cwd: string,
	options: { allowFailure?: boolean; timeoutMs?: number } = {},
): Promise<CommandResult> {
	const result = await new Promise<CommandResult>((resolve, reject) => {
		let closed = false
		let timedOut = false
		const child = spawn(command, args, {
			cwd,
			env: { ...process.env, CI: `true` },
			stdio: [`ignore`, `pipe`, `pipe`],
		})
		let stdout = ``
		let stderr = ``
		const timeout =
			options.timeoutMs === undefined
				? null
				: setTimeout(() => {
						timedOut = true
						stderr += `\nCommand timed out after ${options.timeoutMs}ms.`
						child.kill(`SIGTERM`)
						setTimeout(() => {
							if (!closed) {
								child.kill(`SIGKILL`)
							}
						}, 1_000).unref()
					}, options.timeoutMs)

		child.stdout.setEncoding(`utf8`)
		child.stderr.setEncoding(`utf8`)
		child.stdout.on(`data`, (chunk: string) => {
			stdout += chunk
		})
		child.stderr.on(`data`, (chunk: string) => {
			stderr += chunk
		})
		child.on(`error`, (error) => {
			if (timeout) {
				clearTimeout(timeout)
			}
			reject(error)
		})
		child.on(`close`, (exitCode) => {
			closed = true
			if (timeout) {
				clearTimeout(timeout)
			}
			resolve({ exitCode, stderr, stdout, timedOut })
		})
	})

	if (!options.allowFailure && result.exitCode !== 0) {
		throw new Error(
			[
				`Command failed: ${command} ${args.join(` `)}`,
				`cwd: ${cwd}`,
				result.stdout.trim(),
				result.stderr.trim(),
			]
				.filter(Boolean)
				.join(`\n`),
		)
	}

	return result
}

await main()
