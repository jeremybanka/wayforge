import { resolve } from "node:path"

import { FilesystemStorage } from "safedeposit"

export const storage = new FilesystemStorage<{
	lastTribunalProcessedDate: string
}>({
	path: resolve(process.cwd(), `storage`),
})
