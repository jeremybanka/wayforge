import { atomFamily } from "atom.io"

import type { PageKey } from "./page-key"

type Page = {
	text: string
}

const pageAtoms = atomFamily<Page, PageKey>({
	key: `page`,
	default: { text: `` },
})
