module.exports = {
  extends: [`./packages/@banka/eslint-config/rome/.eslintrc.js`],
  parserOptions: {
    project: [`./tsconfig.json`, `./apps/atom.io.fyi/tsconfig.json`],
    tsconfigRootDir: __dirname,
  },
  "ignorePatterns": ["*.js"],
}
