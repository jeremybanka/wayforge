import type { Tree } from "treetrunks"

export type RouteMatch = {
	path: string[]
	route: string
	tree: Tree | null
	complete: boolean
	error?: string
}

/** Shared route traversal; a missing required child is an incomplete match. */
export function matchRoute(
	cliName: string,
	positionalArgTree: Tree,
	positionalArgs: readonly string[],
): RouteMatch {
	const namedPositionalArgs: string[] = []
	const validPositionalArgs: string[] = []
	let treePointer: Tree | null = positionalArgTree
	let argumentIndex = -1
	if (positionalArgs.length === 0) {
		return {
			path: [],
			route: ``,
			tree: treePointer,
			complete: treePointer[0] !== `required`,
		}
	}
	for (const positionalArg of positionalArgs) {
		argumentIndex++
		if (treePointer === null) {
			const currentPath = positionalArgs.slice(0, argumentIndex)
			const command =
				cliName + (currentPath.length > 0 ? ` -- ${currentPath.join(` `)}` : ``)
			const errorReport = [
				`${currentPath.join(` `)} does not have a positional argument named`,
				``,
				`\t• ${positionalArg}`,
				``,
				`There are no positional arguments for ${command}.`,
				``,
			]
			return {
				path: validPositionalArgs,
				route: namedPositionalArgs.join(`/`),
				tree: treePointer,
				complete: false,
				error: errorReport.join(`\n`),
			}
		}
		if (Object.hasOwn(treePointer[1], positionalArg)) {
			treePointer = treePointer[1][positionalArg]
			namedPositionalArgs.push(positionalArg)
			validPositionalArgs.push(positionalArg)
		} else if (Object.keys(treePointer[1]).length > 0) {
			const variablePath: `$${string}` | undefined = Object.keys(
				treePointer[1],
			).find((key): key is `$${string}` => key.startsWith(`$`))
			if (variablePath) {
				treePointer = treePointer[1][variablePath]
				namedPositionalArgs.push(variablePath)
				validPositionalArgs.push(positionalArg)
				continue
			}
			const currentPath = [...positionalArgs.slice(0, argumentIndex)]
			const command =
				cliName + (currentPath.length > 0 ? ` -- ${currentPath.join(` `)}` : ``)
			const errorReport = [
				`${command} does not have a positional argument named`,
				``,
				`\t• ${positionalArg}`,
				``,
				`Valid positional arguments for ${command} are:`,
				``,
				...Object.keys(treePointer[1]).map((key) => `\t• ${key}`),
				``,
			]
			return {
				path: validPositionalArgs,
				route: namedPositionalArgs.join(`/`),
				tree: treePointer,
				complete: false,
				error: errorReport.join(`\n`),
			}
		} else {
			const currentPath = [...positionalArgs.slice(0, argumentIndex)]
			const command =
				cliName + (currentPath.length > 0 ? ` -- ${currentPath.join(` `)}` : ``)
			const errorReport = [
				`${command} does not have a positional argument named`,
				``,
				`\t• ${positionalArg}`,
				``,
				`No positional arguments should be passed to ${command}.`,
				``,
			]
			return {
				path: validPositionalArgs,
				route: namedPositionalArgs.join(`/`),
				tree: treePointer,
				complete: false,
				error: errorReport.join(`\n`),
			}
		}
	}
	return {
		path: validPositionalArgs,
		route: namedPositionalArgs.join(`/`),
		tree: treePointer,
		complete: treePointer === null || treePointer[0] !== `required`,
	}
}
