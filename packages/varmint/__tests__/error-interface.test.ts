import { Squirrel } from "../src"
import { parseError, stringifyError } from "../src/error-interface"

describe(`error interface`, () => {
	test(`can dehydrate and rehydrate an error`, () => {
		const error = new Error(`test error`)
		const stringifiedError = stringifyError(error)
		const parsedError = parseError(stringifiedError)
		expect(parsedError).toEqual(error)
		console.log({ error })
		console.log({ parsedError })
		console.log({ stringifiedError })
	})
})

describe(`Squirrel supports Error-return`, () => {
	test(`can dehydrate and rehydrate an error`, async () => {
		const squirrel = new Squirrel(`write`)
		const getError = squirrel.add(`errors`, (message: string) =>
			Promise.resolve(new Error(message)),
		)
		const myError0 = await getError.for(`test error`).get(`test error`)
		squirrel.mode = `read`
		const myError1 = await getError.for(`test error`).get(`test error`)
		expect(myError1).toEqual(myError0)
	})
})
