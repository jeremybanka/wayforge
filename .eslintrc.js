module.exports = {
  extends: [`./packages/@banka/eslint-config/rome/.eslintrc.js`],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  }
}
