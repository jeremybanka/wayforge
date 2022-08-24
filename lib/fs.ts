export const getBareJsonFileNames = (filenames: string[]): string[] =>
  filenames
    .filter((filename) => filename.endsWith(`.json`))
    .map((filename) => filename.replace(`.json`, ``))
