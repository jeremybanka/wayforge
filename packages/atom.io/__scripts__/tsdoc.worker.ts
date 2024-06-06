import path from "node:path"

import { compileDocs } from "~/packages/tsdoc.json/src/library"

import { ATOM_IO_ROOT } from "./constants"

declare const self: Worker
self.onmessage = tsDocWorkerJob

export async function tsDocWorkerJob({
	data: subPackageName,
}: MessageEvent): Promise<void> {
	console.log(`📝 Extracting ${subPackageName}`)
	const filename = path.join(ATOM_IO_ROOT, subPackageName, `src`, `index.ts`)
	const doc = compileDocs(filename)
	await Bun.write(
		path.join(ATOM_IO_ROOT, `gen`, `${subPackageName}.tsdoc.json`),
		JSON.stringify(doc, null, `\t`),
	)
	self.postMessage(`Done`)
}
