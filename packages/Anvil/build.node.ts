import { exec } from "child_process"
import * as fs from "fs"

import { generateDtsBundle } from "dts-bundle-generator"
import { build } from "esbuild"
import * as A from "fp-ts/Array"
import { pipe } from "fp-ts/function"

const PACKAGES = [`json`]
const main = () =>
  pipe(
    PACKAGES,
    A.map((packageName) => ({
      filePath: `src/${packageName}/index.ts`,
    })),
    generateDtsBundle,
    A.zip(PACKAGES),
    A.map(([dtsBundle, packageName]) => {
      fs.writeFileSync(`dist/${packageName}/index.d.ts`, dtsBundle)
      build({
        entryPoints: [`src/${packageName}/index.ts`],
        outfile: `dist/${packageName}/index.js`,
        platform: `neutral`,
        format: `esm`,
        sourcemap: true,
        bundle: true,
      }).catch(() => process.exit(1))
    })
  )
const script = exec(`dts-bundle-generator -o dist/index.d.ts src/index.ts`)

script.stdout.on(`data`, (data) => {
  console.log(data)
})
script.stderr.on(`data`, (data) => {
  console.error(data)
})
