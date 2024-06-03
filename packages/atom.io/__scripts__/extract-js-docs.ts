import path from "node:path"

import type { ExtractorResult } from "@microsoft/api-extractor"
import { Extractor, ExtractorConfig } from "@microsoft/api-extractor"
import z from "zod"

import { ATOM_IO_ROOT, PACKAGE_JSON_PATH } from "./constants"

const packageJson = Bun.file(PACKAGE_JSON_PATH)
const packageJsonDataRaw = await packageJson.json()
const packageJsonExports = z
	.object({
		exports: z.record(z.union([z.string(), z.object({ types: z.string() })])),
	})
	.parse(packageJsonDataRaw).exports

await Promise.all(
	Object.entries(packageJsonExports).map(async ([key, value]) => {
		switch (typeof value) {
			case `object`: {
				const apiExtractorJsonPath = path.join(
					ATOM_IO_ROOT,
					key,
					`api-extractor.json`,
				)

				console.log(`📝 Extracting ${apiExtractorJsonPath}`)
				if (key === `./ephemeral`) {
					const extractorConfig: ExtractorConfig =
						ExtractorConfig.loadFileAndPrepare(apiExtractorJsonPath)
					// console.log(`🔧 ExtractorConfig`, extractorConfig)
					const extractorResult: ExtractorResult = Extractor.invoke(
						extractorConfig,
						{
							// Equivalent to the "--local" command-line parameter
							// localBuild: true,

							// Equivalent to the "--verbose" command-line parameter
							showVerboseMessages: true,
						},
					)
				}
			}
		}
	}),
)
