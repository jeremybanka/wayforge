/* eslint-disable @typescript-eslint/no-var-requires */

var baseConfig = require(`../.eslintrc`)

module.exports = {
  extends: [...baseConfig.extends, `plugin:react/recommended`],
  plugins: [...baseConfig.plugins, `react`],
  ignorePatterns: baseConfig.ignorePatterns,
  parser: baseConfig.parser,
  parserOptions: {
    ...baseConfig.parserOptions,
    ecmaFeatures: { jsx: true },
  },
  env: baseConfig.env,
  settings: {
    ...baseConfig.settings,
    react: {
      version: `detect`,
    },
  },
  rules: {
    ...baseConfig.rules,
    "import/order": [
      `error`,
      {
        ...baseConfig.rules[`import/order`][1],
        pathGroups: [
          ...baseConfig.rules[`import/order`][1].pathGroups,
          {
            pattern: `preact`,
            group: `external`,
            position: `before`,
          },
          {
            pattern: `preact/*`,
            group: `external`,
            position: `before`,
          },
          {
            pattern: `react`,
            group: `external`,
            position: `before`,
          },
          {
            pattern: `remix`,
            group: `external`,
            position: `before`,
          },
        ],
        pathGroupsExcludedImportTypes: [`react`, `remix`, `preact`],
      },
    ],
    "react/no-unknown-property": [`error`, { ignore: [`css`] }],
    "react/prop-types": `off`,
    "react/require-default-props": `off`,
    "react/react-in-jsx-scope": `off`,
  },
}
