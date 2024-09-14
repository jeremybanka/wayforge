export async function hashSHA256(str: string): Promise<string> {
	// Encode the string into bytes
	const encoder = new TextEncoder()
	const data = encoder.encode(str)

	// Hash the data using SHA-256
	const hashBuffer = await crypto.subtle.digest(`SHA-256`, data)

	// Convert the buffer to a hexadecimal string
	const hashArray = Array.from(new Uint8Array(hashBuffer))
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, `0`)).join(``)

	return hashHex
}
