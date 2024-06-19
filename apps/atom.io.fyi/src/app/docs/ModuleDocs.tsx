import "./ModuleDocs.scss"

import fs from "node:fs"
import path from "node:path"

import type { TSD } from "tsdoc.json"
import { Mod } from "tsdoc.json/react"

import { ATOM_IO_FYI_ROOT } from "~/apps/atom.io.fyi/scripts/constants"

export function ModuleDocs({ module }: { module: string }): JSX.Element {
	const docsText = fs.readFileSync(
		path.join(ATOM_IO_FYI_ROOT, `gen`, `${module}.tsdoc.json`),
		`utf-8`,
	)
	const docs: TSD.Doc[] = JSON.parse(docsText)
	return (
		<Mod
			className="tsdoc-styles"
			docs={docs.filter(
				(doc) =>
					doc.name === `setState` /* ❗ */ &&
					(doc.type === `function` ||
						(doc.type === `composite` && doc.kind === `class`)),
			)}
		/>
	)
}
