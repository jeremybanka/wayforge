import prettier from "prettier"

export const prettierConfig = prettier.resolveConfig.sync(
  `../../.prettierrc.yml`
)

export const formatJson = (json: string): string =>
  prettier.format(json, { ...prettierConfig, parser: `json` })
