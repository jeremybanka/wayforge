import { cpSync, existsSync, mkdirSync, symlinkSync } from "node:fs"
import path from "node:path"

/** Copy build/pack inputs, while keeping all generated output out of the checkout. */
export function copyPackageWorkspace(
	packageDirectory: string,
	workspace: string,
): string {
	const root = path.resolve(packageDirectory, `../..`)
	const staged = path.join(workspace, `packages/comline`)
	mkdirSync(workspace, { recursive: true })
	for (const file of [
		`package.json`,
		`pnpm-workspace.yaml`,
		`pnpm-lock.yaml`,
		`tsconfig.json`,
		`.npmrc`,
	]) {
		if (existsSync(path.join(root, file)))
			cpSync(path.join(root, file), path.join(workspace, file))
	}
	cpSync(packageDirectory, staged, {
		recursive: true,
		filter: (source) =>
			![`node_modules`, `dist`, `coverage`, `.turbo`].includes(
				path.relative(packageDirectory, source).split(path.sep)[0],
			),
	})
	// pnpm pack resolves workspace:* from the sibling's real version.
	const sibling = path.join(workspace, `packages/treetrunks`)
	mkdirSync(sibling, { recursive: true })
	cpSync(
		path.join(root, `packages/treetrunks/package.json`),
		path.join(sibling, `package.json`),
	)
	// Reuse installed tools and dependencies; never install or build into these links.
	symlinkSync(
		path.join(root, `node_modules`),
		path.join(workspace, `node_modules`),
		`dir`,
	)
	symlinkSync(
		path.join(packageDirectory, `node_modules`),
		path.join(staged, `node_modules`),
		`dir`,
	)
	return staged
}

/** Exercise the release build and manifest in an isolated, disposable workspace. */
export function packComline(
	packageDirectory: string,
	workspace: string,
	pnpm: (args: string[], cwd: string) => void,
): string {
	const staged = copyPackageWorkspace(packageDirectory, workspace)
	const archive = path.join(workspace, `comline.tgz`)
	pnpm([`build`], staged)
	pnpm([`pack`, `--out`, archive], staged)
	return archive
}
