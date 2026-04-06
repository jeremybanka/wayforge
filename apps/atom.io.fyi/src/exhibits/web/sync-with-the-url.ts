import { atom } from "atom.io"
import { searchParamSync } from "atom.io/web"

export const selectedTabAtom = atom<string | null>({
	key: `selectedTab`,
	default: `overview`,
	effects: [searchParamSync(JSON, `tab`)],
})
