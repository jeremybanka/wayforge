import {
	createCipheriv,
	createDecipheriv,
	createHash,
	randomBytes,
	randomUUID,
} from "node:crypto"

const RANDOM_BASE64 = createHash(`sha256`)
	.update(randomBytes(32))
	.digest(`base64`)

/** 32-byte (256-bit) key – store securely (env var, KMS, etc.) */
const SECRET_KEY = Buffer.from(
	RANDOM_BASE64,
	`base64url`, // expect the key to be supplied as base64url
)

/** Lengths in bytes for AES-GCM */
const IV_LEN = 12 // 96-bit nonce is recommended for GCM
const TAG_LEN = 16 // 128-bit auth tag

/** Base64-url helpers */
const b64u = {
	encode: (buf: Buffer) => buf.toString(`base64url`),
	decode: (s: string) => Buffer.from(s, `base64url`),
}

/** Wrap a real ID to an opaque virtual ID */
export function encryptId(realId: number | string): string {
	if (!SECRET_KEY.length) throw new Error(`SECRET_KEY is not set`)

	const iv = randomBytes(IV_LEN)
	const cipher = createCipheriv(`aes-256-gcm`, SECRET_KEY, iv)
	const plaintext = Buffer.from(String(realId), `utf8`)
	const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
	const tag = cipher.getAuthTag()

	// nonce | ciphertext | authTag   → base64url
	return b64u.encode(Buffer.concat([iv, ciphertext, tag]))
}

/** Unwrap a virtual ID back to the real ID (throws on failure) */
export function decryptId(virtualId: string): string {
	if (!SECRET_KEY.length) throw new Error(`SECRET_KEY is not set`)

	const data = b64u.decode(virtualId)
	if (data.length < IV_LEN + TAG_LEN) throw new Error(`Virtual ID is too short`)

	const iv = data.subarray(0, IV_LEN)
	const tag = data.subarray(data.length - TAG_LEN)
	const ciphertext = data.subarray(IV_LEN, data.length - TAG_LEN)

	const decipher = createDecipheriv(`aes-256-gcm`, SECRET_KEY, iv)
	decipher.setAuthTag(tag)
	const decrypted = Buffer.concat([
		decipher.update(ciphertext),
		decipher.final(),
	])

	return decrypted.toString(`utf8`) // original ID as a string
}

export function fakeId(): string {
	return encryptId(randomUUID())
}
