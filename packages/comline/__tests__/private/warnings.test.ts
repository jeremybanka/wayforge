import * as publicApi from "../../src/cli"
import { cli, noOptions, optional, required } from "../../src/cli"
import * as presentation from "../../src/warnings"
import { argv } from "../fixtures/argv"

const testCli = cli({
	cliName: `probe`,
	routes: optional({ run: null, show: required({ $name: null }) }),
	routeOptions: { "": noOptions(), run: noOptions(), "show/$name": noOptions() },
})

test(`completion does not construct warnings while a descendant remains viable`, () => {
	const createWarning = vi.spyOn(presentation, `createWarningFactory`)
	try {
		const context = testCli.interpret({ words: [`--typo`, ``] })
		expect(context.warnings).toEqual([])
		expect(createWarning).not.toHaveBeenCalled()
		expect(testCli(argv(`--typo`)).warnings).toHaveLength(1)
		expect(createWarning).toHaveBeenCalledOnce()
		createWarning.mockClear()
		expect(
			testCli.interpret({ words: [`run`, `--typo`, ``] }).warnings,
		).toHaveLength(1)
		expect(createWarning).toHaveBeenCalledOnce()
	} finally {
		createWarning.mockRestore()
	}
})

test(`command presentation is deferred until a warning and reused within an invocation`, () => {
	const stringify = vi.spyOn(JSON, `stringify`)
	const commandFormats = () =>
		stringify.mock.calls.filter(([value]) => value === `probe show alice`)
	try {
		expect(testCli(argv(`show`, `alice`)).warnings).toEqual([])
		expect(commandFormats()).toHaveLength(0)
		const warnings = testCli(argv(`show`, `alice`, `--bad`, `--other`)).warnings
		expect(warnings.map(({ message }) => message)).toEqual([
			`Unknown option "--bad" for command "probe show alice".`,
			`Unknown option "--other" for command "probe show alice".`,
		])
		expect(commandFormats()).toHaveLength(1)
	} finally {
		stringify.mockRestore()
	}
})

test(`the internal presentation factory owns escaped messages without expanding the public API`, () => {
	expect(presentation.createWarningFactory).toBeTypeOf(`function`)
	const context = {
		cliName: `probe`,
		route: `show/$name`,
		path: [`show`, `alice\n`],
	}
	const warning = presentation.createWarningFactory(context)(
		`unknown-option`,
		`--bad\u001b[2J`,
		2,
	)
	expect(warning).toEqual({
		...context,
		code: `unknown-option`,
		option: `--bad\u001b[2J`,
		index: 2,
		message: `Unknown option "--bad\\u001b[2J" for command "probe show alice\\n".`,
	})
	expect(warning.path).not.toBe(context.path)
	expect(publicApi).not.toHaveProperty(`createWarningFactory`)
})
