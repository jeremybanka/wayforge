import { createHash } from "node:crypto"

export const filenameAllowList = /[^a-zA-Z0-9\-._]/g

export function sanitizeFilename(filename: string): string {
	const onlyValidChars = filename.replace(filenameAllowList, `-`)

	if (onlyValidChars.length <= 64) {
		return onlyValidChars
	}

	const hash = createHash(`sha256`).update(filename).digest(`hex`)
	// Otherwise, trim the beginning to fit within the max length
	return onlyValidChars.slice(-64) + `+` + hash // Keep the last maxLen characters
}
