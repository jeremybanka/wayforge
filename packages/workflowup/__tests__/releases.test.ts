import { describe, expect, it } from "vitest"

import { parseVersion, selectRelease } from "../src/releases.ts"

const direct = `1`.repeat(40)
const peeled = `2`.repeat(40)

describe(`Git release selection`, () => {
	it(`selects stable tags numerically, preferring full versions over aliases`, () => {
		const output = [
			`${direct}\trefs/tags/v9.9.9`,
			`${peeled}\trefs/tags/v10.0.0`,
			`${direct}\trefs/tags/v10`,
			`${direct}\trefs/tags/v11.0.0-rc.1`,
			`${direct}\trefs/tags/latest`,
		].join(`\n`)
		expect(selectRelease(output, `owner/repo`)).toEqual({
			version: `10.0.0`,
			commit: peeled,
		})
	})

	it(`uses peeled commits for annotated tags`, () => {
		expect(
			selectRelease(
				`${direct}\trefs/tags/v1.2.3\n${peeled}\trefs/tags/v1.2.3^{}`,
				`owner/repo`,
			),
		).toEqual({ version: `1.2.3`, commit: peeled })
	})

	it(`rejects missing stable releases and invalid SHA output`, () => {
		expect(() =>
			selectRelease(`${direct}\trefs/tags/v1.0.0-beta.1`, `owner/repo`),
		).toThrow(`No stable version tags`)
		expect(() =>
			selectRelease(`not-a-sha\trefs/tags/v1.0.0`, `owner/repo`),
		).toThrow(`No stable version tags`)
	})

	it.each([
		`main`,
		`01.0.0`,
		`1.02.3`,
		`1.0.0 extra`,
		`99999999999999999999999`,
	])(`ignores invalid version %s`, (version) => {
		expect(parseVersion(version)).toBeNull()
	})
})
