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

describe(`async atom`, async () => {
	it(`handles a rejected promise`, async () => {
		class ClientError extends Error {}

		const retrieveState = async (): Promise<number> => {
			throw new ClientError(`😤`)
		}

		const count = AtomIO.atom<Loadable<number>, ClientError>({
			key: `count`,
			default: retrieveState,
			catch: [ClientError],
		})

		const err = await AtomIO.getState(count)

		expect(err).toBeInstanceOf(ClientError)
	})
})
