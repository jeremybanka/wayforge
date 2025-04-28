import { randomUUID } from "node:crypto"

import { fakeId, unwrapId, wrapId } from "./secrecy"

test(`wrapId and unwrapId`, () => {
	const id = randomUUID()
	const wrapped = wrapId(id)
	const unwrapped = unwrapId(wrapped)
	console.log({
		wrapped,
		unwrapped,
		fake: fakeId(),
	})
	expect(unwrapped).toBe(id)
})
