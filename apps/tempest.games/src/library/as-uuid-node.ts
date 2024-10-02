import { createHash } from "node:crypto"

export function asUUID(input: string): string {
	const hash = createHash(`sha256`).update(input).digest(`hex`)
	const uuid = `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`
	return uuid
}
