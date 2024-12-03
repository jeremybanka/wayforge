import { Ferret } from "../src/ferret"

test(`ferret`, async () => {
	const myAsyncIterable = {
		async *[Symbol.asyncIterator]() {
			await new Promise((resolve) => setTimeout(resolve, 100))
			yield `chunk1`
			await new Promise((resolve) => setTimeout(resolve, 100))
			yield `chunk2`
			await new Promise((resolve) => setTimeout(resolve, 100))
			yield `chunk3`
		},
	}

	const myFerret = new Ferret(`write`)

	const iterable = myFerret.for(`myAsyncIterable`).get(myAsyncIterable)

	const chunksExpected = [`chunk1`, `chunk2`, `chunk3`]
	for await (const chunk of iterable) {
		expect(chunk).toBe(chunksExpected.shift())
	}
})
