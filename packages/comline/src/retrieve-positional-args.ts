import type { Join, Tree, TreePath, TreePathName } from "./tree"

export function retrievePositionalArgs<PositionalArgTree extends Tree>(
	cliName: string,
	positionalArgTree: PositionalArgTree,
	passed: string[],
): {
	path: TreePath<PositionalArgTree>
	route: Join<TreePathName<PositionalArgTree>>
} {
	const endOfOptionsDelimiterIndex = passed.indexOf(`--`)
	const positionalArgs =
		endOfOptionsDelimiterIndex === -1
			? undefined
			: passed.slice(endOfOptionsDelimiterIndex + 1)

	const namedPositionalArgs: string[] = []
	const validPositionalArgs: string[] = []
	let treePointer: object = positionalArgTree
	let argumentIndex = -1
	if (positionalArgs === undefined || positionalArgs.length === 0) {
		if (treePointer[0] === `required`) {
			const currentPath = []
			const command =
				cliName + (currentPath.length > 0 ? ` -- ${currentPath.join(` `)}` : ``)
			const possiblePositionalArgs = Object.keys(treePointer[1])
			const errorReport = [
				`${command} requires one of the following positional arguments:`,
				possiblePositionalArgs.map((arg) => `\t- ${arg}`).join(`\n`),
				``,
			]
			throw new Error(errorReport.join(`\n`))
		}
		return {
			path: [] as TreePath<PositionalArgTree>,
			route: `` as Join<TreePathName<PositionalArgTree>>,
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
			throw new Error(errorReport.join(`\n`))
		}
		if (positionalArg in treePointer[1]) {
			treePointer = treePointer[1][positionalArg]
			namedPositionalArgs.push(positionalArg)
			validPositionalArgs.push(positionalArg)
		} else if (Object.keys(treePointer[1]).length > 0) {
			const variablePath = Object.keys(treePointer[1]).find((key) =>
				key.startsWith(`$`),
			)
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
			throw new Error(errorReport.join(`\n`))
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
			throw new Error(errorReport.join(`\n`))
		}
	}
	return {
		path: validPositionalArgs as TreePath<PositionalArgTree>,
		route: namedPositionalArgs.join(`/`) as Join<
			TreePathName<PositionalArgTree>
		>,
	}
}
