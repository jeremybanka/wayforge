function basename(argument: string): string {
	return argument.split(/[\\/]/).at(-1) ?? ``
}

/** Locate the executable or script in process.argv or executable-prefixed words. */
export function findInvocationIndex(
	cliName: string,
	passed: readonly string[],
): number {
	const first = passed[0]
	if (first === undefined || first.startsWith(`-`)) return -1
	const executable = basename(first)
	// Node and Bun put the script at argv[1]; directory names do not identify it.
	if (
		[`node`, `node.exe`, `nodejs`, `bun`, `bun.exe`].includes(
			executable.toLowerCase(),
		)
	) {
		const script = passed[1]
		return script !== undefined && !script.startsWith(`-`) ? 1 : -1
	}
	if (executable === cliName) return 0
	// Preserve direct script invocations such as probe.x.ts and Windows executables.
	const stem = executable.replace(/\.(?:exe|[cm]?[jt]sx?)$/i, ``)
	return stem !== executable && (stem === cliName || stem === `${cliName}.x`)
		? 0
		: -1
}
