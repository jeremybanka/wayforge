module.exports = {
  extends: [
    `plugin:@typescript-eslint/recommended`,
  ],
  plugins: [
    `@typescript-eslint`
  ],
  parser: `@typescript-eslint/parser`,
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: `module`,
    ecmaFeatures: { jsx: true },
  },
  ignorePatterns: [`**/dist/**`],
  env: {
    node: true,
    browser: true,
    es2021: true,
    mocha: true,
  },
  settings: {},
  rules: {
    "@typescript-eslint/explicit-member-accessibility": `error`,
    "@typescript-eslint/prefer-enum-initializers": `error`,
    "@typescript-eslint/prefer-literal-enum-member": `error`,
    "@typescript-eslint/prefer-optional-chain": `error`,
    "@typescript-eslint/sort-type-constituents": `error`,
    "@typescript-eslint/type-annotation-spacing": `error`,
    "@typescript-eslint/unified-signatures": `error`,
    "@typescript-eslint/no-unused-vars": `off`,
    "@typescript-eslint/no-explicit-any": `off`,
    "@typescript-eslint/explicit-module-boundary-types": `error`,
    "@typescript-eslint/consistent-type-imports": [
      `error`,
      {
        fixStyle: `separate-type-imports`,
        prefer: `type-imports`, 
      },
    ],
    "quotes": [`error`, `backtick`],
    "quote-props": [`error`, `consistent`, { unnecessary: false }],
  },
}
