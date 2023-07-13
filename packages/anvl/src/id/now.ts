export const now = (): string =>
	Date.now().toString().split(``).reverse().join(``)
