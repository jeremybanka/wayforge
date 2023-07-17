import * as AtomIO from "atom.io"
import { bench, vitest } from "vitest"

import * as UTIL from "./__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 1
AtomIO.setLogLevel(LOG_LEVELS[CHOOSE])
const logger = AtomIO.__INTERNAL__.IMPLICIT.STORE.config.logger ?? console

beforeEach(() => {
	AtomIO.__INTERNAL__.clearStore()
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(UTIL, `stdout`)
})

describe(`create, sub to, and modify atoms`, () => {
	bench(`1000`, () => {
		const findCount = AtomIO.atomFamily<number, number>({
			key: `findCount`,
			default: 0,
		})
		const countAtoms = new Array(1000).fill(0).map((_, i) => findCount(i))
		countAtoms.forEach((count) => AtomIO.subscribe(count, UTIL.stdout))
		countAtoms.forEach((count) => AtomIO.setState(count, 1))
	})
})
