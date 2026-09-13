type Release = { ref: string; core: string[]; prerelease: string[] }

function compareInteger(a: string, b: string): number {
	return a.length - b.length || (a > b ? 1 : a < b ? -1 : 0)
}

function compareRelease(a: Release, b: Release): number {
	for (let index = 0; index < 3; index++) {
		const difference = compareInteger(a.core[index], b.core[index])
		if (difference) return difference
	}
	if (!a.prerelease.length || !b.prerelease.length) {
		return Number(!a.prerelease.length) - Number(!b.prerelease.length)
	}
	for (
		let index = 0;
		index < Math.min(a.prerelease.length, b.prerelease.length);
		index++
	) {
		const left = a.prerelease[index]
		const right = b.prerelease[index]
		const leftNumeric = /^\d+$/.test(left)
		const rightNumeric = /^\d+$/.test(right)
		const difference =
			leftNumeric && rightNumeric
				? compareInteger(left, right)
				: leftNumeric !== rightNumeric
					? Number(rightNumeric) - Number(leftNumeric)
					: left > right
						? 1
						: left < right
							? -1
							: 0
		if (difference) return difference
	}
	return a.prerelease.length - b.prerelease.length
}

export function latestReleaseTag(
	remoteTags: string,
	tagPattern?: string,
): string | undefined {
	const pattern = tagPattern ? new RegExp(tagPattern) : undefined
	let latest: Release | undefined
	for (const line of remoteTags.split(`\n`)) {
		if (pattern && !pattern.test(line)) continue
		const ref = line.split(`\t`)[1]?.replace(/\^\{\}$/, ``)
		if (!ref?.startsWith(`refs/tags/`)) continue
		const name = ref.slice(`refs/tags/`.length)
		const version = name.slice(name.lastIndexOf(`@`) + 1)
		const match =
			/^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.exec(
				version,
			)
		if (!match) continue
		const prerelease = match[4]?.split(`.`) ?? []
		if (prerelease.some((identifier) => /^0\d+$/.test(identifier))) continue
		const release: Release = { ref, core: match.slice(1, 4), prerelease }
		if (!latest || compareRelease(release, latest) > 0) latest = release
	}
	return latest?.ref
}
