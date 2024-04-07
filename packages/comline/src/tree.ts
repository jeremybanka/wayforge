export const REQUIRED = `required` as const
export const OPTIONAL = `optional` as const

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
