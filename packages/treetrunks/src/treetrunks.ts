export function required<T>(arg: T): [`required`, T] {
	return [`required`, arg]
}
export function optional<T>(arg: T): [`optional`, T] {
	return [`optional`, arg]
}

export type TreeContents = Readonly<{ [key: string]: Tree | null }>
export type OptionalTree = [`optional`, TreeContents]
export type RequiredTree = [`required`, TreeContents]
export type Tree = OptionalTree | RequiredTree

export type TreePath<T extends Tree> = {
	[K in keyof T[1]]: T[0] extends `required`
		? T[1][K] extends Tree
			? [K extends `$${string}` ? string & {} : K, ...TreePath<T[1][K]>]
			: [K extends `$${string}` ? string & {} : K]
		:
				| (T[1][K] extends Tree
						? [K extends `$${string}` ? string & {} : K, ...TreePath<T[1][K]>]
						: [K extends `$${string}` ? string & {} : K])
				| []
}[keyof T[1]]

export type TreePathName<T extends Tree> = {
	[K in keyof T[1]]: T[0] extends `required`
		? T[1][K] extends Tree
			? [K, ...TreePathName<T[1][K]>]
			: [K]
		: (T[1][K] extends Tree ? [K, ...TreePathName<T[1][K]>] : [K]) | []
}[keyof T[1]]

export type Flat<R extends { [K in PropertyKey]: any }> = {
	[K in keyof R]: R[K]
}

export type TreeMap<T extends Tree, P, J extends string = `/`> = {
	[K in Join<TreePathName<T>, J>]: P
}

export type Join<
	Arr extends any[],
	Separator extends string = ``,
> = Arr extends []
	? ``
	: Arr extends [infer First extends string]
		? First
		: Arr extends [infer First extends string, ...infer Rest extends string[]]
			? `${First}${Separator}${Join<Rest, Separator>}`
			: string

export type ToPath<
	S extends string,
	D extends string,
> = S extends `${infer T extends string}${D}${infer U extends string}`
	? T extends `$${string}`
		? [string & {}, ...ToPath<U, D>]
		: [T, ...ToPath<U, D>]
	: S extends `$${string}`
		? [string & {}]
		: [S]

export function isTreePath<T extends Tree>(
	tree: T,
	maybePath: unknown[],
): maybePath is TreePath<T> {
	let currentTreeNode: (Tree | null)[] | Tree | null = tree
	for (const segment of maybePath) {
		if (currentTreeNode === null) {
			return false
		}
		if (typeof segment !== `string`) {
			return false
		}
		let subPaths: TreeContents | TreeContents[] // = currentTreeNode[1]
		if (typeof currentTreeNode[0] === `string`) {
			subPaths = currentTreeNode[1]
		} else {
			const filteredTreeNodes: Tree[] = currentTreeNode.filter((x) => x !== null)
			switch (filteredTreeNodes.length) {
				case 0:
					return false
				case 1:
					currentTreeNode = filteredTreeNodes[0]
					subPaths = filteredTreeNodes[0][1]
					break
				default:
					currentTreeNode = filteredTreeNodes
					subPaths = filteredTreeNodes.map(([_, value]) => value)
			}
		}
		let wildcard: string | undefined
		//= Object.keys(subPaths).find((key) => key.startsWith(`$`))
		if (Array.isArray(subPaths)) {
			wildcard = subPaths
				.map((paths) => Object.keys(paths).find((key) => key.startsWith(`$`)))
				.find((key) => key !== undefined)
		} else {
			wildcard = Object.keys(subPaths).find((key) => key.startsWith(`$`))
		}
		if (segment in subPaths) {
			const nextNode = subPaths[segment]
			if (wildcard) {
				if (typeof currentTreeNode[0] === `string`) {
					currentTreeNode = []
				}
				currentTreeNode.push(nextNode, subPaths[wildcard])
			} else {
				currentTreeNode = nextNode
			}
		} else {
			if (wildcard) {
				currentTreeNode = subPaths[wildcard]
				continue
			}
			return false
		}
	}
	if (currentTreeNode === null) {
		return true
	}
	if (typeof currentTreeNode[0] === `string`) {
		switch (currentTreeNode[0]) {
			case `required`:
				return false
			case `optional`:
				return true
		}
	}
	for (const node of currentTreeNode) {
		if (node?.[0] === `optional`) {
			return true
		}
	}
	return false
}
