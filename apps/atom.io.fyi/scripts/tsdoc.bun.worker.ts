import path from "node:path"

import * as Bun from "bun"
import { compileDocs } from "tsdoc.json"

import {
	ATOM_IO_ROOT,
	ATOM_IO_SRC,
} from "../../../packages/atom.io/__scripts__/constants"
import { ATOM_IO_FYI_ROOT } from "./constants"

declare const self: Worker
self.onmessage = async function tsDocWorkerJob({
	data: subPackageName,
}: { data: string }): Promise<void> {
	console.log(`📝 Extracting ${subPackageName}`)
	const entrypoint = path.join(ATOM_IO_SRC, subPackageName, `index.ts`)
	const tsconfigPath = path.join(ATOM_IO_ROOT, `tsconfig.json`)
	const doc = compileDocs({ entrypoint, tsconfigPath })
	await Bun.write(
		path.join(ATOM_IO_FYI_ROOT, `gen`, `${subPackageName}.tsdoc.json`),
		JSON.stringify(doc, null, `\t`),
	)
	self.postMessage(`Done`)
}
