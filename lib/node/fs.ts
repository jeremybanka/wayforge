import fs from "fs"

export const getJsonFileNames = (dir: string): string[] => {
  const fileNames = fs.readdirSync(dir)
  const jsonFileNames = fileNames.filter((fileName) =>
    fileName.endsWith(`.json`)
  )
  return jsonFileNames
}

export const getDirectoryJsonEntriesRaw = (dir: string): [string, string][] =>
  getJsonFileNames(dir).map((fileName): [string, string] => [
    fileName,
    fs.readFileSync(`${dir}/${fileName}`, `utf8`),
  ])

export type GetDirectoryJsonEntriesOptions<T> = {
  readonly dir: string
  readonly refine: (json: unknown) => T
  readonly suppressWarnings?: boolean
}

export const getDirectoryJsonEntries = <T>({
  dir,
  refine,
  suppressWarnings = false,
}: GetDirectoryJsonEntriesOptions<T>): [string, T][] =>
  getDirectoryJsonEntriesRaw(dir)
    .map(([fileName, fileContents]) => {
      let json: unknown
      let parsed: T | undefined = undefined
      try {
        json = JSON.parse(fileContents)
      } catch (error) {
        if (!suppressWarnings) {
          console.warn(
            `The file ${fileName} in the directory ${dir} is not valid JSON.`
          )
        }
      }
      try {
        parsed = refine(json)
      } catch (error) {
        if (!suppressWarnings) {
          console.warn(
            `The file ${fileName} in the directory ${dir} does not match the expected type.`
          )
        }
      }
      return [fileName, parsed]
    })
    .filter(([, parsed]) => parsed !== undefined) as [string, T][]

export const getBareJsonFileNames = (dir: string): string[] =>
  getJsonFileNames(dir).map((filename) => filename.replace(`.json`, ``))
