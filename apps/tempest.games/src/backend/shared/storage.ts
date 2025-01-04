import { resolve } from "node:path"

import { FilesystemStorage } from "flightdeck"

export const storage = new FilesystemStorage<{
	lastTribunalProcessedDate: string
}>({
	path: resolve(process.cwd(), `storage`),
})
