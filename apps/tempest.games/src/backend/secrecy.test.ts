import { randomUUID } from "node:crypto"

import { decryptId, encryptId, fakeId } from "./secrecy"

test(`wrapId and unwrapId`, () => {
	const id = randomUUID()
	const wrapped = encryptId(id)
	const unwrapped = decryptId(wrapped)
	console.log({
		wrapped,
		unwrapped,
		fake: fakeId(),
	})
	console.log({
		wrapped: wrapped.length,
		unwrapped: unwrapped.length,
		fake: fakeId().length,
	})
	expect(unwrapped).toBe(id)
})
