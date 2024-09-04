import path, { resolve } from "node:path"

import { $ } from "bun"
import { describe, it } from "bun:test"
import tmp from "tmp"

import { ServiceManager } from "../src/lib"

const testDirname = import.meta.dir

describe(`ServiceManager`, () => {
	it(`should start a service`, () => {
		const tmpDir = tmp.dirSync()
		const manager = new ServiceManager(
			`sample/repo`,
			`my-app`,
			`app`,
			tmpDir.name,
			async (destination) => {
				console.log(`❗❗❗❗❗❗`, destination)
				console.log(resolve(destination, `app`))
				await $`bun build ${testDirname}/fixtures/app.ts --compile --outfile ${resolve(destination, `app`)}`
				console.log((await $`ls ${destination}`).stdout)
			},
		)
		// console.log(manager)
	})
})
