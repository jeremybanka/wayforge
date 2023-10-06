import * as http from "http"
import { vitest } from "vitest"

import * as AtomIO from "atom.io"
import * as Internal from "atom.io/internal"
import { parseJson } from "atom.io/json"
import * as Utils from "./__util__"

beforeEach(() => {
	Internal.clearStore()
	vitest.spyOn(Utils, `stdout`)
})

describe(`async atom`, async () => {
	it(`hits the subscriber twice`, async () => {
		const count = AtomIO.atom<Internal.Loadable<number>>({
			key: `count`,
			default: 0,
		})
		AtomIO.subscribe(count, ({ newValue, oldValue }) => {
			Utils.stdout(`count`, { newValue, oldValue })
		})
		const getNumber = async () => 1
		AtomIO.setState(count, getNumber())
		const countValueInitial = AtomIO.getState(count)
		expect(countValueInitial).toBeInstanceOf(Promise)
		expect(countValueInitial).toBeInstanceOf(Internal.Future)
		const countValueAwaited = await AtomIO.getState(count)
		expect(countValueAwaited).toBe(1)
		expect(Utils.stdout).toHaveBeenCalledTimes(2)
	})
	it(`handles a rejected promise`, async () => {
		const count = AtomIO.atom<Internal.Loadable<number>>({
			key: `count`,
			default: 0,
		})
		AtomIO.subscribe(count, ({ newValue, oldValue }) => {
			Utils.stdout(`count`, { newValue, oldValue })
		})
		const getNumber = async (): Promise<number> => {
			throw new Error(`😤`)
		}
		AtomIO.setState(count, getNumber())
		const countValueInitial = AtomIO.getState(count)
		expect(countValueInitial).toBeInstanceOf(Promise)
		expect(countValueInitial).toBeInstanceOf(Internal.Future)

		expect(Utils.stdout).toHaveBeenCalledTimes(1)
	})
})

const PORT = 418
const ORIGIN = `http://localhost:${PORT}`
const server = http.createServer((req, res) => {
	let data: Uint8Array[] = []
	req
		.on(`data`, (chunk) => {
			data.push(chunk)
		})
		.on(`end`, () => {
			const authHeader = req.headers.authorization
			try {
				if (authHeader !== `Bearer MY_BEARER_TOKEN`) throw 401
				if (typeof req.url !== `string`) throw 418
				const url = new URL(req.url, ORIGIN)

				switch (req.method) {
					case `POST`: {
						const body = parseJson(Buffer.concat(data).toString())
						switch (url.pathname) {
							case `/divide`:
								if (
									typeof body === `object` &&
									body !== null &&
									`dividend` in body &&
									`divisor` in body &&
									typeof body.dividend === `number` &&
									typeof body.divisor === `number`
								) {
									const { dividend, divisor } = body
									const quotient =
										divisor === 0
											? dividend >= 0
												? `Infinity`
												: `-Infinity`
											: dividend / divisor

									res.writeHead(200, {
										"Content-Type": `application/json`,
									})
									res.end(
										JSON.stringify({
											quotient: quotient.toString(),
										}),
									)
								} else {
									throw 400
								}
								break
							default:
								throw 404
						}
						break
					}

					default:
						throw 405
				}
			} catch (thrown) {
				if (typeof thrown === `number`) {
					res.writeHead(thrown)
					res.end()
				} else {
					throw thrown
				}
			} finally {
				data = []
			}
		})
})

beforeAll(() => {
	server.listen(PORT)
})

describe(`async selector`, () => {
	test(`selector as a caching mechanism for async data`, async () => {
		const { atom, selector, getState, store } = new AtomIO.Silo(`math`)
		// AtomIO.setLogLevel(`info`, store)
		const dividendState = atom<number>({
			key: `dividend`,
			default: 0,
		})
		const divisorState = atom<number>({
			key: `divisor`,
			default: 0,
		})
		const quotientState = selector<Error | Promise<Error | number> | number>({
			key: `quotient`,
			get: async ({ get }) => {
				const dividend = get(dividendState)
				const divisor = get(divisorState)
				const response = await fetch(`${ORIGIN}/divide`, {
					method: `POST`,
					headers: {
						authorization: `Bearer MY_BEARER_TOKEN`,
					},
					body: JSON.stringify({ dividend, divisor }),
				})
				const json = await response.json()
				const { quotient } = json

				if (typeof quotient === `string`) {
					const parsed = parseFloat(quotient)
					if (isNaN(parsed)) return Error(`quotient is NaN`)
					return parsed
				}
				return Error(`quotient is not a string`)
			},
		})
		const quotient0 = getState(quotientState)
		expect(quotient0).toBeInstanceOf(Promise)
		expect(quotient0).toBeInstanceOf(Internal.Future)

		const quotient1 = await getState(quotientState)

		expect(quotient1).toBe(Infinity)

		const quotient2 = getState(quotientState)
		expect(quotient2).toBe(Infinity)
	})
})
