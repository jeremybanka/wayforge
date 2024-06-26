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
			? [K extends `$${string}` ? string : K, ...TreePath<T[1][K]>]
			: [K extends `$${string}` ? string : K]
		:
				| (T[1][K] extends Tree
						? [K extends `$${string}` ? string : K, ...TreePath<T[1][K]>]
						: [K extends `$${string}` ? string : K])
				| []
}[keyof T[1]]
