import { argv } from "../fixtures/argv"
import { createWarningPresentationCli } from "../fixtures/warning-cases"

const testCli = createWarningPresentationCli()

test(`completion defers warnings while a descendant remains viable`, () => {
	const context = testCli.interpret({ words: [`--typo`, ``] })
	expect(context.warnings).toEqual([])

	expect(testCli(argv(`--typo`)).warnings).toHaveLength(1)

	expect(
		testCli.interpret({ words: [`run`, `--typo`, ``] }).warnings,
	).toHaveLength(1)
})

test(`each warning identifies its option and selected command`, () => {
	expect(testCli(argv(`show`, `alice`)).warnings).toEqual([])

	const warnings = testCli(argv(`show`, `alice`, `--bad`, `--other`)).warnings
	expect(
		warnings.map(({ code, option, route, path }) => ({
			code,
			option,
			route,
			path,
		})),
	).toEqual([
		{
			code: `unknown-option`,
			option: `--bad`,
			route: `show/$name`,
			path: [`show`, `alice`],
		},
		{
			code: `unknown-option`,
			option: `--other`,
			route: `show/$name`,
			path: [`show`, `alice`],
		},
	])
})
