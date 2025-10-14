/* eslint-disable @typescript-eslint/only-throw-error */
/* eslint-disable @typescript-eslint/require-await */
import * as http from "node:http"

import type { Loadable } from "atom.io"
import * as AtomIO from "atom.io"
import * as Internal from "atom.io/internal"
import { parseJson } from "atom.io/json"

import * as Utils from "../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 0

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	vitest.spyOn(Utils, `stdout`)
})

describe(`async atom`, async () => {
	it(`hits the subscriber twice`, async () => {
		const count = AtomIO.atom<Loadable<number>>({
			key: `count`,
			default: 0,
		})
		AtomIO.subscribe(count, (update) => {
			Utils.stdout(`count`, update)
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
		const count = AtomIO.atom<Loadable<number>>({
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

describe(`async selector`, () => {
	const PORT = 3443
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
										typeof body[`dividend`] === `number` &&
										typeof body[`divisor`] === `number`
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
						case undefined:
							throw 418
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
	server.listen(PORT)

	afterAll(() => {
		server.close()
	})

	test(`selector as a caching mechanism for async data`, async () => {
		const { atom, selector, getState /* store */ } = new AtomIO.Silo({
			name: `math`,
			lifespan: `ephemeral`,
			isProduction: false,
		})
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
					const parsed = Number.parseFloat(quotient)
					if (Number.isNaN(parsed)) return Error(`quotient is NaN`)
					return parsed
				}
				return Error(`quotient is not a string`)
			},
		})
		const quotient0 = getState(quotientState)
		expect(quotient0).toBeInstanceOf(Promise)
		expect(quotient0).toBeInstanceOf(Internal.Future)

		const quotient1 = await getState(quotientState)

		expect(quotient1).toBe(Number.POSITIVE_INFINITY)

		const quotient2 = getState(quotientState)
		expect(quotient2).toBe(Number.POSITIVE_INFINITY)
	})
})

describe(`downstream from async`, () => {
	test(`sync selector downstream from async atom`, async () => {
		const countAtom = AtomIO.atom<Loadable<number>>({
			key: `count`,
			default: () =>
				new Promise((resolve) =>
					setTimeout(() => {
						resolve(1)
					}, 10),
				),
		})
		const typeSelector = AtomIO.selector<string>({
			key: `doubled`,
			get: ({ get }) => {
				const count = get(countAtom)
				return typeof count
			},
		})
		const countLoadable = AtomIO.getState(countAtom)
		expect(countLoadable).toBeInstanceOf(Internal.Future)

		expect(AtomIO.getState(typeSelector)).toBe(`object`)

		const count = await countLoadable
		expect(count).toBe(1)
		expect(AtomIO.getState(typeSelector)).toBe(`number`)
	})
	test(`sync selector downstream from async selector`, async () => {
		const countAtom = AtomIO.atom<number>({
			key: `count`,
			default: 2,
		})
		const doubledSelector = AtomIO.selector<Loadable<number>>({
			key: `doubled`,
			get: async ({ get }) => {
				const count = get(countAtom)
				const double = count * 2
				return double
			},
		})
		const typeSelector = AtomIO.selector<string>({
			key: `tripled`,
			get: ({ get }) => {
				const doubled = get(doubledSelector)
				return typeof doubled
			},
		})

		const doubledLoadable = AtomIO.getState(doubledSelector)
		expect(doubledLoadable).toBeInstanceOf(Internal.Future)
		expect(AtomIO.getState(typeSelector)).toBe(`object`)

		const doubled = await doubledLoadable
		expect(doubled).toBe(4)

		expect(AtomIO.getState(typeSelector)).toBe(`number`)
	})
	test(`loadable index`, async () => {
		let loadOrgId = (_: number) => {
			console.warn(`loadOrgId not attached`)
		}

		const orgIdAtom = AtomIO.atom<Loadable<number>>({
			key: `orgId`,
			default: () => new Promise((resolve) => (loadOrgId = resolve)),
		})

		const loadIndex: Record<number, () => void> = {}
		const loadItems: Record<number, () => void> = {}

		const indexAtoms = AtomIO.atomFamily<Loadable<number[]>, number>({
			key: `index`,
			default: (key) =>
				new Promise((resolve) => {
					loadIndex[key] = () => {
						resolve([1, 2, 3])
					}
				}),
		})
		const itemAtoms = AtomIO.atomFamily<Loadable<{ data: string }>, number>({
			key: `items`,
			default: (key) =>
				new Promise<{ data: string }>((resolve) => {
					loadItems[key] = () => {
						resolve({ data: `${key}`.repeat(3) })
					}
				}),
		})

		let idx = 0
		const allItemsSelector = AtomIO.selector<Loadable<{ data: string }[]>>({
			key: `allItems`,
			get: async ({ get }) => {
				const i = idx++
				const orgId = await get(orgIdAtom)
				console.log(i, `👀 iod`, orgId)
				const index = get(indexAtoms, orgId)
				console.log(i, `👀 idx`, index)
				const itemIds = await index
				console.log(i, `👀 iid`, itemIds)
				const items = await Promise.all(itemIds.map((id) => get(itemAtoms, id)))
				console.log(i, `👀`, items)

				return items
			},
		})

		AtomIO.subscribe(allItemsSelector, ({ newValue, oldValue }) => {
			console.count(`❗❗❗ subscriber`)
			console.log(`❗❗❗ subscriber`, {
				newValue,
				oldValue,
				newValueEqualsOldValue: newValue === oldValue,
			})
			Utils.stdout({ newValue, oldValue })
		})

		expect(AtomIO.getState(indexAtoms, 0)).toBeInstanceOf(Internal.Future)
		expect(AtomIO.getState(itemAtoms, 1)).toBeInstanceOf(Internal.Future)
		expect(AtomIO.getState(itemAtoms, 2)).toBeInstanceOf(Internal.Future)
		expect(AtomIO.getState(itemAtoms, 3)).toBeInstanceOf(Internal.Future)
		expect(AtomIO.getState(allItemsSelector)).toBeInstanceOf(Internal.Future)
		loadIndex[0]()
		await new Promise((resolve) => setImmediate(resolve))
		expect(AtomIO.getState(indexAtoms, 0)).toEqual([1, 2, 3])
		expect(AtomIO.getState(itemAtoms, 1)).toBeInstanceOf(Internal.Future)
		expect(AtomIO.getState(itemAtoms, 2)).toBeInstanceOf(Internal.Future)
		expect(AtomIO.getState(itemAtoms, 3)).toBeInstanceOf(Internal.Future)
		expect(AtomIO.getState(allItemsSelector)).toBeInstanceOf(Internal.Future)
		loadItems[1]()
		await new Promise((resolve) => setImmediate(resolve))
		expect(AtomIO.getState(indexAtoms, 0)).toEqual([1, 2, 3])
		expect(AtomIO.getState(itemAtoms, 1)).toEqual({ data: `1`.repeat(3) })
		expect(AtomIO.getState(itemAtoms, 2)).toBeInstanceOf(Internal.Future)
		expect(AtomIO.getState(itemAtoms, 3)).toBeInstanceOf(Internal.Future)
		expect(AtomIO.getState(allItemsSelector)).toBeInstanceOf(Internal.Future)
		loadItems[2]()
		await new Promise((resolve) => setImmediate(resolve))
		expect(AtomIO.getState(indexAtoms, 0)).toEqual([1, 2, 3])
		expect(AtomIO.getState(itemAtoms, 1)).toEqual({ data: `1`.repeat(3) })
		expect(AtomIO.getState(itemAtoms, 2)).toEqual({ data: `2`.repeat(3) })
		expect(AtomIO.getState(itemAtoms, 3)).toBeInstanceOf(Internal.Future)
		expect(AtomIO.getState(allItemsSelector)).toBeInstanceOf(Internal.Future)
		loadItems[3]()
		await new Promise((resolve) => setImmediate(resolve))
		expect(AtomIO.getState(indexAtoms, 0)).toEqual([1, 2, 3])
		expect(AtomIO.getState(itemAtoms, 1)).toEqual({ data: `1`.repeat(3) })
		expect(AtomIO.getState(itemAtoms, 2)).toEqual({ data: `2`.repeat(3) })
		expect(AtomIO.getState(itemAtoms, 3)).toEqual({ data: `3`.repeat(3) })
		expect(AtomIO.getState(allItemsSelector)).toBeInstanceOf(Internal.Future)
		loadOrgId(0)

		AtomIO.resetState(indexAtoms, 0)
		AtomIO.resetState(itemAtoms, 1)
		expect(AtomIO.getState(indexAtoms, 0)).toBeInstanceOf(Internal.Future)
		expect(AtomIO.getState(itemAtoms, 1)).toBeInstanceOf(Internal.Future)
		expect(AtomIO.getState(itemAtoms, 2)).toEqual({ data: `2`.repeat(3) })
		expect(AtomIO.getState(itemAtoms, 3)).toEqual({ data: `3`.repeat(3) })
		expect(AtomIO.getState(allItemsSelector)).toBeInstanceOf(Internal.Future)

		loadIndex[0]()
		loadItems[1]()
		await new Promise((resolve) => setImmediate(resolve))
		console.log(Internal.IMPLICIT.STORE.valueMap)
		const allItemsValue = Internal.IMPLICIT.STORE.valueMap.get(
			allItemsSelector.key,
		)
		console.log(allItemsValue[`fate`] === allItemsValue)
		expect(AtomIO.getState(indexAtoms, 0)).toEqual([1, 2, 3])
		expect(AtomIO.getState(itemAtoms, 1)).toEqual({ data: `1`.repeat(3) })
		expect(AtomIO.getState(itemAtoms, 2)).toEqual({ data: `2`.repeat(3) })
		expect(AtomIO.getState(itemAtoms, 3)).toEqual({ data: `3`.repeat(3) })
		expect(AtomIO.getState(allItemsSelector)).toEqual([
			{ data: `1`.repeat(3) },
			{ data: `2`.repeat(3) },
			{ data: `3`.repeat(3) },
		])
	})
})
