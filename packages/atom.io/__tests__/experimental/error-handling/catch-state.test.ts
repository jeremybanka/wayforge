/* eslint-disable @typescript-eslint/require-await */

import type { Loadable } from "atom.io"
import * as AtomIO from "atom.io"
import * as Internal from "atom.io/internal"

import * as Utils from "../../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 0

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	vitest.spyOn(Utils, `stdout`)
})

describe(`immediate states that throw`, () => {
	describe(`atom`, () => {
		it(`(happy) catches a thrown error`, () => {
			class ClientError extends Error {
				public constructor(hey: string) {
					super()
					console.log(`😤`, hey)
				}
			}

			const retrieveState = (): number => {
				throw new ClientError(`😤`)
			}

			const countAtom: AtomIO.AtomToken<number, null, ClientError> = AtomIO.atom(
				{
					key: `count`,
					default: retrieveState,
					catch: [ClientError],
				},
			)

			const err = AtomIO.getState(countAtom)

			expect(err).toBeInstanceOf(ClientError)
		})
		it(`(sad) doesn't catch an error category it doesn't know about`, () => {
			class ClientError extends Error {}

			const retrieveState = (): number => {
				throw new Error(`😤`) // not a ClientError
			}

			const countAtom = AtomIO.atom<number, ClientError>({
				key: `count`,
				default: retrieveState,
				catch: [ClientError],
			})

			expect(() => AtomIO.getState(countAtom)).toThrowError(Error)
		})
	})
	describe(`atom family`, () => {
		it(`(happy) catches a thrown error`, () => {
			class ClientError extends Error {}

			const retrieveState = (): number => {
				throw new ClientError(`😤`)
			}

			const countAtoms = AtomIO.atomFamily<number, string, ClientError>({
				key: `count`,
				default: retrieveState,
				catch: [ClientError],
			})

			const err = AtomIO.getState(countAtoms, `example`)

			expect(err).toBeInstanceOf(ClientError)
		})
		it(`(sad) doesn't catch an error category it doesn't know about`, () => {
			class ClientError extends Error {}

			const retrieveState = (): number => {
				throw new Error(`😤`) // not a ClientError
			}

			const countAtoms = AtomIO.atomFamily<number, string, ClientError>({
				key: `count`,
				default: retrieveState,
				catch: [ClientError],
			})

			expect(() => AtomIO.getState(countAtoms, `example`)).toThrowError(Error)
		})
	})
	describe(`selector`, () => {
		it(`(happy) catches a thrown error`, () => {
			class ClientError extends Error {}

			const retrieveState = (): number => {
				throw new ClientError(`😤`)
			}

			const countSelector = AtomIO.selector<number, ClientError>({
				key: `count`,
				get: retrieveState,
				catch: [ClientError],
			})

			const err = AtomIO.getState(countSelector)

			expect(err).toBeInstanceOf(ClientError)
		})
		it(`(sad) doesn't catch an error category it doesn't know about`, () => {
			class ClientError extends Error {}

			const retrieveState = (): number => {
				throw new Error(`😤`) // not a ClientError
			}

			const countSelector = AtomIO.selector<number, ClientError>({
				key: `count`,
				get: retrieveState,
				catch: [ClientError],
			})

			expect(() => AtomIO.getState(countSelector)).toThrowError(Error)
		})
	})
	describe(`selector family`, () => {
		it(`(happy) catches a thrown error`, () => {
			class ClientError extends Error {}

			const retrieveState = (): number => {
				throw new ClientError(`😤`)
			}

			const countSelectors = AtomIO.selectorFamily<number, string, ClientError>({
				key: `count`,
				get: () => retrieveState,
				catch: [ClientError],
			})

			const err = AtomIO.getState(countSelectors, `example`)

			expect(err).toBeInstanceOf(ClientError)
		})
		it(`(sad) doesn't catch an error category it doesn't know about`, () => {
			class ClientError extends Error {}

			const retrieveState = (): number => {
				throw new Error(`😤`) // not a ClientError
			}

			const countSelectors = AtomIO.selectorFamily<number, string, ClientError>({
				key: `count`,
				get: () => retrieveState,
				catch: [ClientError],
			})

			expect(() => AtomIO.getState(countSelectors, `example`)).toThrowError(
				Error,
			)
		})
	})
})

describe(`loadable states that reject`, async () => {
	describe(`loadable atom`, () => {
		it(`catches a rejected promise`, async () => {
			class ClientError extends Error {}

			const retrieveState = async (): Promise<number> => {
				throw new ClientError(`😤`)
			}

			const countAtom = AtomIO.atom<Loadable<number>, ClientError>({
				key: `count`,
				default: retrieveState,
				catch: [ClientError],
			})

			const err = await AtomIO.getState(countAtom)

			expect(err).toBeInstanceOf(ClientError)
		})
		it(`(sad) doesn't catch an error category it doesn't know about`, async () => {
			class ClientError extends Error {}
			const retrieveState = async (): Promise<number> => {
				throw new Error(`😤`) // not a ClientError
			}
			const countAtom = AtomIO.atom<Loadable<number>, ClientError>({
				key: `count`,
				default: retrieveState,
				catch: [ClientError],
			})

			let err: any
			try {
				await AtomIO.getState(countAtom)
			} catch (e) {
				err = e
			}
			expect(err).toBeInstanceOf(Error)
		})
	})
	describe(`loadable atom family`, () => {
		it(`(happy) catches a thrown error`, async () => {
			class ClientError extends Error {}

			const retrieveState = async (): Promise<number> => {
				throw new ClientError(`😤`)
			}

			const countAtoms = AtomIO.atomFamily<
				Loadable<number>,
				string,
				ClientError
			>({
				key: `count`,
				default: retrieveState,
				catch: [ClientError],
			})

			const err = await AtomIO.getState(countAtoms, `example`)

			expect(err).toBeInstanceOf(ClientError)
		})
		it(`(sad) doesn't catch an error category it doesn't know about`, async () => {
			class ClientError extends Error {}
			const retrieveState = async (): Promise<number> => {
				throw new Error(`😤`) // not a ClientError
			}
			const countAtoms = AtomIO.atomFamily<
				Loadable<number>,
				string,
				ClientError
			>({
				key: `count`,
				default: retrieveState,
				catch: [ClientError],
			})
			let err: any
			try {
				await AtomIO.getState(countAtoms, `example`)
			} catch (e) {
				err = e
			}
			expect(err).toBeInstanceOf(Error)
		})
	})
	describe(`loadable selector`, async () => {
		it(`(happy) catches a rejected promise`, async () => {
			class ClientError extends Error {}

			const retrieveState = async (): Promise<number> => {
				throw new ClientError(`😤`)
			}

			const countSelector = AtomIO.selector<Loadable<number>, ClientError>({
				key: `count`,
				get: retrieveState,
				catch: [ClientError],
			})

			const err = await AtomIO.getState(countSelector)

			expect(err).toBeInstanceOf(ClientError)
		})
		it(`(sad) doesn't catch an error category it doesn't know about`, async () => {
			class ClientError extends Error {}

			const retrieveState = async (): Promise<number> => {
				throw new Error(`😤`) // not a ClientError
			}

			const countSelector = AtomIO.selector<Loadable<number>, ClientError>({
				key: `count`,
				get: retrieveState,
				catch: [ClientError],
			})

			let err: any
			try {
				await AtomIO.getState(countSelector)
			} catch (e) {
				err = e
			}
			expect(err).toBeInstanceOf(Error)
		})
	})
	describe(`loadable selector family`, async () => {
		it(`(happy) catches a thrown error`, async () => {
			class ClientError extends Error {}

			const retrieveState = async (): Promise<number> => {
				throw new ClientError(`😤`)
			}

			const countSelectors = AtomIO.selectorFamily<
				Loadable<number>,
				string,
				ClientError
			>({
				key: `count`,
				get: () => retrieveState,
				catch: [ClientError],
			})

			const err = await AtomIO.getState(countSelectors, `example`)

			expect(err).toBeInstanceOf(ClientError)
		})
		it(`(sad) doesn't catch an error category it doesn't know about`, async () => {
			class ClientError extends Error {}
			const retrieveState = async (): Promise<number> => {
				throw new Error(`😤`) // not a ClientError
			}
			const countSelectors = AtomIO.selectorFamily<
				Loadable<number>,
				string,
				ClientError
			>({
				key: `count`,
				get: () => retrieveState,
				set: () => () => {},
				catch: [ClientError],
			})
			let err: any
			try {
				await AtomIO.getState(countSelectors, `example`)
			} catch (e) {
				err = e
			}
			expect(err).toBeInstanceOf(Error)
		})
	})
})
