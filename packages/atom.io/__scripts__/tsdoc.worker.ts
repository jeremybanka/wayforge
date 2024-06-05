import path from "node:path"

import { ATOM_IO_ROOT } from "./constants"
import { advancedDemo } from "./tsdoc.lib"

declare const self: Worker

self.onmessage = async ({ data: subPackageName }: MessageEvent) => {
	console.log(`📝 Extracting ${subPackageName}`)
	const doc = advancedDemo(subPackageName)
	await Bun.write(
		path.join(ATOM_IO_ROOT, `gen`, `${subPackageName}.tsdoc.json`),
		JSON.stringify(doc, null, `\t`),
	)
	self.postMessage(`Done`)
}
