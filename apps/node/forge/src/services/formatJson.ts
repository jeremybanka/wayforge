import prettier from "prettier"

export const alphabetize = <T extends Record<string, unknown>>(obj: T): T => {
	const sortedKeys = Object.keys(obj).sort()
	const sortedObj = {} as Record<string, unknown>
	for (const key of sortedKeys) {
		sortedObj[key] = obj[key]
	}
	return sortedObj as T
}

export const formatJson = async (json: string): Promise<string> => {
	const prettierConfig = await prettier.resolveConfig(process.cwd())
	return prettier.format(json, {
		...prettierConfig,
		parser: `json`,
	})
}
