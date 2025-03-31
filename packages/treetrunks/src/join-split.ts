export type Join<
	Arr extends any[],
	Separator extends string = `,`,
> = Arr extends []
	? ``
	: Arr extends [infer First extends string]
		? First
		: Arr extends [infer First extends string, ...infer Rest extends string[]]
			? `${First}${Separator}${Join<Rest, Separator>}`
			: string

export type Split<
	S extends string,
	D extends string = `/`,
> = S extends `${infer T extends string}${D}${infer U extends string}`
	? [T, ...Split<U, D>]
	: S extends ``
		? []
		: [S]

export type Deref<S extends string[], V extends string = `$`> = S extends [
	`${infer T extends string}`,
	...infer U extends string[],
]
	? T extends `${V}${string}`
		? [string & {}, ...Deref<U, V>]
		: [T, ...Deref<U, V>]
	: []
