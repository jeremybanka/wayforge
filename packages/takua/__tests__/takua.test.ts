import { Logger } from "../src/takua"

test(`takua`, () => {
	const logger = new Logger({ colorEnabled: true })

	logger.info(`hi`, `there`, {
		foo: `bar`,
		baz: 123,
		qux: true,
		quux: null,
		corge: [`a`, `b`, `c`],
		grault: {
			garply: 123,
			waldo: true,
			fred: null,
			plugh: [`a`, `b`, `c`],
			xyzzy: {
				thud: 123,
				xyzzy: [`a`, `b`, `c`],
			},
		},
	})
	logger.warn(`hi`, `there`, {
		foo: `bar`,
		baz: 123,
	})
	logger.error(`hi`, `there`, {
		foo: `bar`,
		baz: 123,
		qux: true,
		quux: null,
		corge: [`a`, `b`, `c`],
		grault: {
			garply: 123,
			waldo: true,
			fred: null,
			plugh: [`a`, `b`, `c`],
			xyzzy: {
				thud: 123,
				xyzzy: [`a`, `b`, `c`],
			},
		},
	})
})
