export const userSessionMap: Map<string, Set<string>> = (() => {
	let { __userSessionMap } = globalThis as any
	if (!__userSessionMap) {
		__userSessionMap = globalThis.__userSessionMap = new Map()
	}
	return __userSessionMap
})()
