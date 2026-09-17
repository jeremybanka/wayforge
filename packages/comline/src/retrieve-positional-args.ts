import type { Tree } from "treetrunks"

export type RouteMatch = {
	path: string[]
	params: Record<string, string | [string, ...string[]]>
	/** The selected terminal capture remains available for subsequent completion. */
	rest?: { name: string; route: string }
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
	const params: RouteMatch[`params`] = {}
	const validPositionalArgs: string[] = []
	let treePointer: Tree | null = positionalArgTree
	let argumentIndex = -1
	if (positionalArgs.length === 0) {
		return {
			path: [],
			params,
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
				params,
				route: namedPositionalArgs.join(`/`),
				tree: treePointer,
				complete: false,
				error: errorReport.join(`\n`),
			}
		}
		const branches: Tree[1] = treePointer[1]
		const segment = Object.hasOwn(branches, positionalArg)
			? positionalArg
			: Object.keys(branches).find((key) => key.startsWith(`$`))
		if (segment !== undefined) {
			namedPositionalArgs.push(segment)
			const rest = segment.startsWith(`$...`)
			if (segment.startsWith(`$`)) {
				Object.defineProperty(params, segment.slice(rest ? 4 : 1), {
					value: rest ? positionalArgs.slice(argumentIndex) : positionalArg,
					enumerable: true,
					writable: true,
					configurable: true,
				})
			}
			if (rest) {
				const route = namedPositionalArgs.join(`/`)
				return {
					path: [...validPositionalArgs, ...positionalArgs.slice(argumentIndex)],
					params,
					route,
					tree: null,
					complete: true,
					rest: { name: segment, route },
				}
			}
			treePointer = branches[segment]
			validPositionalArgs.push(positionalArg)
		} else if (Object.keys(branches).length > 0) {
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
				params,
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
				params,
				route: namedPositionalArgs.join(`/`),
				tree: treePointer,
				complete: false,
				error: errorReport.join(`\n`),
			}
		}
	}
	return {
		path: validPositionalArgs,
		params,
		route: namedPositionalArgs.join(`/`),
		tree: treePointer,
		complete: treePointer === null || treePointer[0] !== `required`,
	}
}
