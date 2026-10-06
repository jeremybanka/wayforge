import { cpSync, existsSync, mkdirSync, symlinkSync } from "node:fs"
import path from "node:path"

// Installed-CLI contracts need a real dependency archive. Stage and build it
// inside their disposable fixture instead of relying on a workspace prebuild.
export function stageTreeTrunks(
	comlineDirectory: string,
	workspace: string,
	pnpm: (args: string[], cwd: string) => unknown,
): string {
	const root = path.resolve(comlineDirectory, `../..`)
	const source = path.join(root, `packages/treetrunks`)
	const staged = path.join(workspace, `packages/treetrunks`)
	mkdirSync(staged, { recursive: true })
	for (const file of [
		`package.json`,
		`pnpm-workspace.yaml`,
		`pnpm-lock.yaml`,
		`tsconfig.json`,
		`.npmrc`,
		`.pnpmfile.mjs`,
	]) {
		if (existsSync(path.join(root, file)))
			cpSync(path.join(root, file), path.join(workspace, file))
	}
	for (const file of [
		`src`,
		`package.json`,
		`tsconfig.json`,
		`tsdown.config.ts`,
		`README.md`,
		`LICENSE`,
		`AGENTS.md`,
	]) {
		if (existsSync(path.join(source, file)))
			cpSync(path.join(source, file), path.join(staged, file), {
				recursive: true,
			})
	}
	symlinkSync(
		path.join(root, `node_modules`),
		path.join(workspace, `node_modules`),
		`dir`,
	)
	symlinkSync(
		path.join(source, `node_modules`),
		path.join(staged, `node_modules`),
		`dir`,
	)
	pnpm([`build`], staged)
	return staged
}
