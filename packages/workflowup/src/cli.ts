import { parseArgs } from "node:util"

import { upgradeWorkflows } from "./workflows.ts"

try {
	const { values } = parseArgs({
		options: {
			"dry-run": { type: `boolean`, default: false },
			cwd: { type: `string` },
			help: { type: `boolean`, short: `h` },
		},
	})
	if (values.help) {
		console.log(
			`Usage: workflowup [--dry-run] [--cwd <repository>]\n\nUpgrade GitHub Actions to stable release SHAs and update pinned mise versions.\nRequires Node.js and Git. --dry-run resolves upgrades without writing files.`,
		)
	} else {
		const result = await upgradeWorkflows({
			dryRun: values[`dry-run`],
			...(values.cwd ? { cwd: values.cwd } : {}),
		})
		const reported = new Set<string>()
		for (const update of result.updates) {
			const from =
				update.kind === `action`
					? `${update.currentVersion} (${update.currentRef.slice(0, 8)})`
					: update.currentVersion
			const to =
				update.kind === `action`
					? `${update.targetVersion} (${update.targetRef.slice(0, 8)})`
					: update.targetVersion
			const line = `${update.dependency} ${from}${update.changed ? ` -> ${to}` : ``}`
			if (!reported.has(line)) console.log(line)
			reported.add(line)
		}
		if (!result.updates.length)
			console.log(`No supported workflow dependencies found under .github`)
		console.log(
			values[`dry-run`]
				? `Dry run: ${result.files.length} file(s) would change; no files updated`
				: `Updated ${result.files.length} file(s)`,
		)
	}
} catch (error: unknown) {
	console.error(error instanceof Error ? error.message : String(error))
	process.exitCode = 1
}
