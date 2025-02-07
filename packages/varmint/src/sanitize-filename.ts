import { createHash } from "node:crypto"

export const filenameAllowList = /[^a-zA-Z0-9\-._]/g

export function sanitizeFilename(filename: string, maxLen = 64): string {
	const onlyValidChars = filename.replace(filenameAllowList, `-`)

	if (onlyValidChars.length <= maxLen) {
		return onlyValidChars
	}

	const hash = createHash(`sha256`).update(filename).digest(`hex`)
	// Otherwise, trim the beginning to fit within the max length
	return onlyValidChars.slice(-maxLen) + `+` + hash // Keep the last maxLen characters
}
