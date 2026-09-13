import { cpSync, existsSync, mkdirSync, symlinkSync } from "node:fs"
import path from "node:path"

/** Copy Comline build/pack inputs within the Wayforge workspace layout. */
export function copyComlineWorkspace(
	comlineDirectory: string,
	workspace: string,
): string {
	const root = path.resolve(comlineDirectory, `../..`)
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
	mkdirSync(staged, { recursive: true })
	for (const file of [
		`src`,
		`package.json`,
		`tsconfig.json`,
		`tsdown.config.ts`,
		`shell-source.config.ts`,
	]) {
		cpSync(path.join(comlineDirectory, file), path.join(staged, file), {
			recursive: true,
		})
	}
	for (const file of [`README.md`, `LICENSE`, `.npmignore`, `.npmrc`]) {
		if (existsSync(path.join(comlineDirectory, file)))
			cpSync(path.join(comlineDirectory, file), path.join(staged, file))
	}
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
		path.join(comlineDirectory, `node_modules`),
		path.join(staged, `node_modules`),
		`dir`,
	)
	return staged
}

/** Exercise the release build and manifest in an isolated, disposable workspace. */
export function packComline(
	comlineDirectory: string,
	workspace: string,
	pnpm: (args: string[], cwd: string) => void,
): string {
	const staged = copyComlineWorkspace(comlineDirectory, workspace)
	const archive = path.join(workspace, `comline.tgz`)
	pnpm([`build`], staged)
	pnpm([`pack`, `--out`, archive], staged)
	return archive
}
