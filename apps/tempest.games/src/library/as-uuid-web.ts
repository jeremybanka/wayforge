async function createHash(input, algorithm = `SHA-256`) {
	const encoder = new TextEncoder()
	const data = encoder.encode(input)
	const hashBuffer = await crypto.subtle.digest(algorithm, data)
	const hashArray = Array.from(new Uint8Array(hashBuffer))
	return hashArray.map((b) => b.toString(16).padStart(2, `0`)).join(``)
}

export async function asUUID(input: string): Promise<string> {
	const hash = await createHash(input)
	const uuid = `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`
	return uuid
}
