import { __INTERNAL__, setLogLevel, useLogger } from "../src"

const doNothing = () => null

describe(`setLogLevel`, () => {
	it(`allows logging at the preferred level`, () => {
		expect(__INTERNAL__.IMPLICIT.STORE.config.logger?.info).toBe(doNothing)
		expect(__INTERNAL__.IMPLICIT.STORE.config.logger?.warn).toBe(console.warn)
		expect(__INTERNAL__.IMPLICIT.STORE.config.logger?.error).toBe(console.error)

		setLogLevel(`info`)

		expect(__INTERNAL__.IMPLICIT.STORE.config.logger?.info).toBe(console.info)
		expect(__INTERNAL__.IMPLICIT.STORE.config.logger?.warn).toBe(console.warn)
		expect(__INTERNAL__.IMPLICIT.STORE.config.logger?.error).toBe(console.error)

		setLogLevel(`warn`)
		expect(__INTERNAL__.IMPLICIT.STORE.config.logger?.info).toBe(doNothing)
		expect(__INTERNAL__.IMPLICIT.STORE.config.logger?.warn).toBe(console.warn)
		expect(__INTERNAL__.IMPLICIT.STORE.config.logger?.error).toBe(console.error)

		setLogLevel(`error`)
		expect(__INTERNAL__.IMPLICIT.STORE.config.logger?.info).toBe(doNothing)
		expect(__INTERNAL__.IMPLICIT.STORE.config.logger?.warn).toBe(doNothing)
		expect(__INTERNAL__.IMPLICIT.STORE.config.logger?.error).toBe(console.error)

		setLogLevel(null)
		expect(__INTERNAL__.IMPLICIT.STORE.config.logger).toBe(null)
	})
})

describe(`useLogger`, () => {
	it(`permits use of a custom logger`, () => {
		const logger = { info: () => null, warn: () => null, error: () => null }
		setLogLevel(`info`)
		useLogger(logger)
		expect(__INTERNAL__.IMPLICIT.STORE.config.logger?.info).toBe(logger.info)
		expect(__INTERNAL__.IMPLICIT.STORE.config.logger?.warn).toBe(logger.warn)
		expect(__INTERNAL__.IMPLICIT.STORE.config.logger?.error).toBe(logger.error)
	})
})
