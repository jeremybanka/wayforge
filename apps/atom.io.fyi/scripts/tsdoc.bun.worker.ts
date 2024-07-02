import path from "node:path"

import * as Bun from "bun"

import { ATOM_IO_ROOT } from "~/packages/atom.io/__scripts__/constants"
import { compileDocs } from "~/packages/tsdoc.json/src/library"

import { ATOM_IO_FYI_ROOT } from "./constants"

declare const self: Worker
self.onmessage = tsDocWorkerJob

export async function tsDocWorkerJob({
	data: subPackageName,
}: { data: string }): Promise<void> {
	console.log(`📝 Extracting ${subPackageName}`)
	const entrypoint = path.join(ATOM_IO_ROOT, subPackageName, `src`, `index.ts`)
	const tsconfigPath = path.join(ATOM_IO_ROOT, `tsconfig.json`)
	const doc = compileDocs({ entrypoint, tsconfigPath })
	await Bun.write(
		path.join(ATOM_IO_FYI_ROOT, `gen`, `${subPackageName}.tsdoc.json`),
		JSON.stringify(doc, null, `\t`),
	)
	self.postMessage(`Done`)
}
