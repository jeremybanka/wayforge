import type { Tree } from "./tree.ts"

/** Named values captured by a path name, including nonempty terminal rest captures. */
export type TreePathParams<Path extends string[]> = {
	[
		Segment in Path[number] as Segment extends `$...${infer Name}`
			? Name
			: Segment extends `$${infer Name}`
				? Name
				: never
	]: Segment extends `$...${string}` ? [string, ...string[]] : string
}

/** Reject ambiguous captures before matching or presenting a route tree. */
export function validateTreeCaptures(tree: Tree): void {
	function visit(node: Tree, path: string[], names: ReadonlySet<string>): void {
		const branches = Object.entries(node[1])
		for (const [segment, child] of branches) {
			const route = [...path, segment]
			const rest = segment.startsWith(`$...`)
			if (
				rest &&
				(segment.length === 4 || child !== null || branches.length !== 1)
			) {
				throw new Error(
					`Invalid rest capture "${route.join(`/`)}": $...name must have a name, a null child, and be the sole child at its position.`,
				)
			}
			const nextNames = new Set(names)
			if (segment.startsWith(`$`)) {
				const name = segment.slice(rest ? 4 : 1)
				if (names.has(name)) {
					throw new Error(
						`Duplicate capture name "${name}" in route "${route.join(`/`)}".`,
					)
				}
				nextNames.add(name)
			}
			if (child) visit(child, route, nextNames)
		}
	}
	visit(tree, [], new Set())
}
