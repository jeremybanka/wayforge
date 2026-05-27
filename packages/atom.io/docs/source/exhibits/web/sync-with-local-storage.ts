import { atom } from "atom.io"
import { storageSync } from "atom.io/web"

export const sidebarOpenAtom = atom<boolean | null>({
	key: `sidebarOpen`,
	default: true,
	effects: [storageSync(localStorage, JSON, `sidebarOpen`)],
})
