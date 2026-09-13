import { expect, it } from "bun:test"

import { latestReleaseTag } from "../src/release-tag"

it(`orders stable, prerelease, numeric and scoped package versions`, () => {
	const refs = [
		`1.2.0`,
		`v1.10.0-alpha`,
		`v1.10.0-alpha.1`,
		`v1.10.0-alpha.beta`,
		`v1.10.0-beta.2`,
		`v1.10.0-beta.11`,
		`v1.10.0-rc.1`,
		`v1.10.0+build.1`,
		`@scope/package@2.0.0`,
	]
	for (let count = 1; count <= refs.length; count++) {
		const remote = refs
			.slice(0, count)
			.reverse()
			.map((ref) => `abc\trefs/tags/${ref}`)
			.join(`\n`)
		expect(latestReleaseTag(remote)).toBe(`refs/tags/${refs[count - 1]}`)
	}
})

it(`keeps tag filtering and handles peeled annotated tags`, () => {
	const remote = `abc\trefs/tags/a@1.0.0\ndef\trefs/tags/a@1.0.0^{}\nghi\trefs/tags/b@9.0.0\n`
	expect(latestReleaseTag(remote, `a@`)).toBe(`refs/tags/a@1.0.0`)
	expect(latestReleaseTag(remote, `missing@`)).toBeUndefined()
})
