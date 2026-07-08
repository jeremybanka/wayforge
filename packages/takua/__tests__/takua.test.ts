import { Logger, type LogSink } from "../src/takua"

afterEach(() => {
	vi.restoreAllMocks()
})

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

test(`logger writes through a configured sink`, () => {
	const log = vi.spyOn(console, `log`).mockImplementation(() => undefined)
	const entries: [level: string, message: string][] = []
	const sink: LogSink = {
		error: (message) => entries.push([`error`, message]),
		info: (message) => entries.push([`info`, message]),
		warn: (message) => entries.push([`warn`, message]),
	}
	const logger = new Logger({ colorEnabled: false, sink })

	logger.info(`hi`, `there`)
	logger.warn(`heads`, `up`, `careful`)
	logger.error(`oh`, `no`)

	expect(entries).toEqual([
		[`info`, `info hi there `],
		[`warn`, `warn heads up careful`],
		[`error`, `ERR! oh no `],
	])
	expect(log).not.toHaveBeenCalled()
})

test(`chronicle writes every line through the configured sink`, () => {
	const log = vi.spyOn(console, `log`).mockImplementation(() => undefined)
	const entries: [level: string, message: string][] = []
	const sink: LogSink = {
		error: (message) => entries.push([`error`, message]),
		info: (message) => entries.push([`info`, message]),
		log: (message) => entries.push([`log`, message]),
		warn: (message) => entries.push([`warn`, message]),
	}
	const logger = new Logger({ colorEnabled: false, sink })
	const chronicle = logger.makeChronicle()

	chronicle.mark(`start`)
	chronicle.mark(`step`)
	chronicle.logMarks()

	expect(
		entries.some(([level, message]) => {
			return level === `info` && message.startsWith(`info step `)
		}),
	).toBe(true)
	expect(
		entries.some(([level, message]) => {
			return level === `info` && message.startsWith(`info TOTAL TIME `)
		}),
	).toBe(true)
	expect(entries.at(-1)).toEqual([`log`, ``])
	expect(log).not.toHaveBeenCalled()
})
