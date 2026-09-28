import { execFile } from "node:child_process"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)

export type Version = {
	major: number
	minor: number
	patch: number
	segments: number
	prerelease: boolean
}

export type Release = { version: string; commit: string }
export type Releases = { latest: Release; tags: Map<string, string> }

export function parseVersion(value: string): Version | null {
	const match =
		/^v?(0|[1-9]\d*)(?:\.(0|[1-9]\d*))?(?:\.(0|[1-9]\d*))?(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(
			value,
		)
	if (!match) return null
	const major = Number(match[1])
	const minor = Number(match[2] ?? 0)
	const patch = Number(match[3] ?? 0)
	if (![major, minor, patch].every(Number.isSafeInteger)) return null
	return {
		major,
		minor,
		patch,
		segments: match[3] ? 3 : match[2] ? 2 : 1,
		prerelease: Boolean(match[4]),
	}
}

export function compareVersions(left: Version, right: Version): number {
	return (
		left.major - right.major ||
		left.minor - right.minor ||
		left.patch - right.patch ||
		Number(right.prerelease) - Number(left.prerelease)
	)
}

// Read direct and peeled refs together so annotated tags resolve to commits,
// and the selected tag and SHA come from the same remote snapshot.
export async function readReleases(repository: string): Promise<Releases> {
	const remote = `https://github.com/${repository}.git`
	const { stdout } = await execFileAsync(
		`git`,
		[`ls-remote`, `--tags`, remote],
		{
			encoding: `utf8`,
			timeout: 60_000,
			maxBuffer: 32 * 1024 * 1024,
			env: { ...process.env, GIT_TERMINAL_PROMPT: `0` },
		},
	)
	const tags = parseTags(stdout)
	return { latest: selectRelease(stdout, repository), tags }
}

function parseTags(output: string): Map<string, string> {
	const refs = new Map<string, string>()
	for (const line of output.split(/\r?\n/)) {
		const match = /^([0-9a-f]{40})\s+refs\/tags\/(.+)$/i.exec(line)
		if (match) refs.set(match[2]!, match[1]!)
	}
	for (const [tag, commit] of refs) {
		if (tag.endsWith(`^{}`)) refs.set(tag.slice(0, -3), commit)
	}
	return refs
}

export function selectRelease(output: string, repository: string): Release {
	const refs = parseTags(output)
	const tags = [...refs.keys()].flatMap((tag) => {
		const version = parseVersion(tag)
		return version && !version.prerelease ? [{ tag, version }] : []
	})
	tags.sort(
		(left, right) =>
			compareVersions(right.version, left.version) ||
			right.version.segments - left.version.segments ||
			left.tag.localeCompare(right.tag),
	)
	const latest = tags[0]
	if (!latest) throw new Error(`No stable version tags found for ${repository}`)
	const commit = refs.get(`${latest.tag}^{}`) ?? refs.get(latest.tag)!
	return { version: latest.tag.replace(/^v/, ``), commit }
}
