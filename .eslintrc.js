module.exports = {
  extends: [`./packages/@banka/eslint-config/react/.eslintrc.js`],
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname,
  }
}
