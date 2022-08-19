export default {
  displayName: `react-sample-app-name`,
  preset: `../../jest.preset.js`,
  transform: {
    "^(?!.*\\.(js|jsx|ts|tsx|css|json)$)": `@nrwl/react/plugins/jest`,
    "^.+\\.[tj]sx?$": `babel-jest`,
  },
  moduleFileExtensions: [`ts`, `tsx`, `js`, `jsx`],
  coverageDirectory: `../../coverage/apps/react-sample-app-name`,
}
