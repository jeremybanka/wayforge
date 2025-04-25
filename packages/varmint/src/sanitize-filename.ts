import { createHash } from "node:crypto"

export const filenameAllowList = /[^a-zA-Z0-9\-._]/g

export function sanitizeFilename(filename: string, maxLen = 64): string {
	if (maxLen % 2 === 1) {
		maxLen += 1
	}
	const onlyValidChars = filename.replace(filenameAllowList, `-`)

	if (onlyValidChars.length <= maxLen) {
		return onlyValidChars
	}

	const hash = createHash(`sha256`)
		.update(filename)
		.digest(`base64`)
		.slice(0, 8)
		.replace(`/`, `_`)
	// Otherwise, trim the beginning to fit within the max length
	let baseName = onlyValidChars
	if (baseName.length > maxLen) {
		const beginning = baseName.slice(0, maxLen / 2)
		const end = baseName.slice(-maxLen / 2)
		baseName = beginning + `_` + end
	}
	return baseName + `+` + hash // Keep the last maxLen characters
}
