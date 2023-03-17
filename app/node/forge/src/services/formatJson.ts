import prettier from "prettier"

export const prettierConfig = prettier.resolveConfig.sync(
  `../../.prettierrc.yml`
)

export const alphabetize = <T extends Record<string, unknown>>(obj: T): T => {
  const sortedKeys = Object.keys(obj).sort()
  const sortedObj = {} as Record<string, unknown>
  sortedKeys.forEach((key) => (sortedObj[key] = obj[key]))
  return sortedObj as T
}

export const formatJson = (json: string): string =>
  prettier.format(json, { ...prettierConfig, parser: `json` })
