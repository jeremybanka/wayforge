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
	V extends string = `$`,
> = S extends `${infer T extends string}${D}${infer U extends string}`
	? T extends `${V}${string}`
		? [string & {}, ...Split<U, D>]
		: [T, ...Split<U, D>]
	: S extends `${V}${string}`
		? [string & {}]
		: [S]
