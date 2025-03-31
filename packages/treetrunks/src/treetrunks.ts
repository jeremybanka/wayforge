export function required<T>(arg: T): [`required`, T] {
	return [`required`, arg]
}
export function optional<T>(arg: T): [`optional`, T] {
	return [`optional`, arg]
}

export type TreeBranches = Readonly<{ [key: string]: Tree | null }>
export type OptionalTree = [`optional`, TreeBranches]
export type RequiredTree = [`required`, TreeBranches]
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

export type TreePathNameExhaustive<T extends Tree> = {
	[K in keyof T[1]]:
		| (T[1][K] extends Tree ? [K, ...TreePathNameExhaustive<T[1][K]>] : [K])
		| []
}[keyof T[1]]

export type Flat<R extends { [K in PropertyKey]: any }> = {
	[K in keyof R]: R[K]
}

export type TreeMap<T extends Tree, P, J extends string = `/`> = {
	[K in Join<TreePathName<T>, J>]: P
}

export type TreeMapExhaustive<T extends Tree, P, J extends string = `/`> = {
	[K in Join<TreePathNameExhaustive<T>, J>]: P
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
	let possibleTrees: (Tree | null)[] = [tree]

	for (const segment of maybePath) {
		if (typeof segment !== `string`) {
			return false // segments should always be strings
		}
		possibleTrees = possibleTrees.flatMap((t) => {
			if (t === null) {
				return []
			}
			const treesDiscovered: (Tree | null)[] = []
			const branches = t[1]
			const segmentSubTree = branches[segment]
			if (segmentSubTree !== undefined) {
				treesDiscovered.push(segmentSubTree)
			}

			const wildcard = Object.keys(branches).find((key) => key.startsWith(`$`))
			if (wildcard) {
				const wildcardSubTree = branches[wildcard]
				if (wildcardSubTree) {
					treesDiscovered.push(wildcardSubTree)
				}
			}
			return treesDiscovered
		})
	}

	for (const possibleTree of possibleTrees) {
		if (possibleTree === null) {
			return true
		}
		if (possibleTree[0] === `optional`) {
			return true
		}
	}
	return false
}
