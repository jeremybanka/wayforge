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
