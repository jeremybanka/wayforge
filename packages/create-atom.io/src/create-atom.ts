import { existsSync, promises as fs } from "node:fs"
import { resolve } from "node:path"

import * as prompts from "@clack/prompts"
import { getPackageInfo } from "local-pkg"
import picocolors from "picocolors"
import type { Colors } from "picocolors/types"
import { x } from "tinyexec"

const pico: Colors = picocolors.createColors(true)

const s = prompts.spinner()

export type PackageManager = `bun` | `npm` | `pnpm` | `yarn`
export type TemplateName = `preact-svg-editor` | `react-node-backend`

export type CreateAtomOptions = {
	packageManager: PackageManager
	templateName: TemplateName
}

export type CreateAtomOptionsPreloaded = {
	[K in keyof CreateAtomOptions]?: CreateAtomOptions[K] | undefined
} & { skipHints?: boolean | undefined }

export async function createAtom(
	argDir: string | undefined,
	options: CreateAtomOptionsPreloaded,
): Promise<void> {
	const skipHint = options.skipHints ?? false
	const packageManager = options.packageManager ?? getPkgManager()

	prompts.intro(pico.greenBright(`atom.io - Data Components for TypeScript`))

	const { dir, templateName } = await prompts.group(
		{
			templateName: () =>
				prompts.select<TemplateName>({
					message: `Template:`,
					initialValue: `preact-svg-editor`,
					options: [
						{
							label: `Preact SVG Editor`,
							value: `preact-svg-editor`,
						},
						{
							label: `React Node Backend`,
							value: `react-node-backend`,
						},
					],
				}),
			dir: () =>
				argDir
					? Promise.resolve(argDir)
					: prompts.text({
							message: `Project directory:`,
							placeholder: `my-app`,
							validate(value) {
								if (value.length === 0) {
									return `Directory name is required!`
								}
								if (existsSync(value)) {
									return `Refusing to overwrite existing directory or file! Please provide a non-clashing name.`
								}
							},
						}),
		},
		{
			onCancel: () => {
				prompts.cancel(pico.yellow(`Cancelled`))
				process.exit(0)
			},
		},
	)
	const targetDir = resolve(process.cwd(), dir)
	const opts: CreateAtomOptions = { packageManager, templateName }

	await useSpinner(
		`Setting up your project directory...`,
		() => scaffold(targetDir, opts),
		`Set up project directory`,
	)

	await useSpinner(
		`Installing project dependencies...`,
		() => installDeps(targetDir, opts),
		`Installed project dependencies`,
	)

	if (skipHint === false) {
		const gettingStarted = `
			${pico.dim(`$`)} ${pico.blueBright(`cd ${dir}`)}
			${pico.dim(`$`)} ${pico.blueBright(
				`${
					packageManager === `npm`
						? `npm run`
						: packageManager === `bun`
							? `bun run`
							: packageManager
				} dev`,
			)}
		`
		prompts.note(
			gettingStarted.trim().replace(/^\t\t\t/gm, ``),
			`Getting Started`,
		)
	}

	prompts.outro(pico.green(`You're all set!`))
}

async function useSpinner(
	startMessage: string,
	fn: () => Promise<void>,
	finishMessage: string,
): Promise<void> {
	s.start(startMessage)
	await fn()
	s.stop(pico.green(finishMessage))
}

async function scaffold(to: string, opts: CreateAtomOptions): Promise<void> {
	await fs.mkdir(to, { recursive: true })

	const templateInfo = await getPackageInfo(
		`@atom.io/template-${opts.templateName}`,
		{
			paths: [process.cwd(), import.meta.dirname],
		},
	)
	if (!templateInfo) throw new Error(`Could not find template package`)
	const { rootPath } = templateInfo
	await templateDir(rootPath, to, opts)
}

/**
 * Recursive fs copy, swiped from `create-wmr`:
 * https://github.com/preactjs/wmr/blob/3c5672ecd2f958c8eaf372d33c084dc69228ae3f/packages/create-wmr/src/index.js#L108-L124
 */
async function templateDir(
	from: string,
	to: string,
	opts: CreateAtomOptions,
): Promise<void[]> {
	const files = await fs.readdir(from)
	const results = await Promise.all(
		files.map(async (f) => {
			if (f === `.` || f === `..`) return
			const filename = resolve(from, f)
			if ((await fs.stat(filename)).isDirectory()) {
				await fs.mkdir(resolve(to, f), { recursive: true })
				return templateDir(filename, resolve(to, f), opts)
			}
			if (opts.packageManager !== `npm` && f === `README.md`) {
				await fs.writeFile(
					resolve(to, f),
					(await fs.readFile(filename, `utf-8`)).replace(
						/npm run/g,
						opts.packageManager === `bun` ? `bun run` : opts.packageManager,
					),
				)
				return
			}
			// Publishing to npm renames the .gitignore to .npmignore
			// https://github.com/npm/npm/issues/7252#issuecomment-253339460
			if (f === `_gitignore`) f = `.gitignore`
			await fs.copyFile(filename, resolve(to, f))
		}),
	)
	return results.flat(99)
}

async function installDeps(to: string, opts: CreateAtomOptions) {
	const dependencies: string[] = []
	const devDependencies: string[] = []

	const installOpts = {
		packageManager: opts.packageManager,
		to,
	}

	await installPackages(dependencies, { ...installOpts })
	devDependencies.length &&
		(await installPackages(devDependencies, { ...installOpts, dev: true }))
}

type InstallOptions = {
	packageManager: `bun` | `npm` | `pnpm` | `yarn`
	to: string
	dev?: boolean
}

function installPackages(pkgs: string[], opts: InstallOptions) {
	return x(
		opts.packageManager,
		[
			// `yarn add` will fail if nothing is provided
			opts.packageManager === `yarn` ? (pkgs.length ? `add` : ``) : `install`,
			opts.dev ? `-D` : ``,
			...pkgs,
		].filter(Boolean),
		{
			nodeOptions: {
				stdio: `ignore`,
				cwd: opts.to,
			},
		},
	)
}

function getPkgManager(): `bun` | `npm` | `pnpm` | `yarn` {
	const userAgent = process.env[`npm_config_user_agent`] ?? ``
	if (userAgent.startsWith(`yarn`)) return `yarn`
	if (userAgent.startsWith(`pnpm`)) return `pnpm`
	if (userAgent.startsWith(`bun`)) return `bun`
	return `npm`
}
