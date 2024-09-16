import { readdir } from "node:fs/promises"
import { resolve } from "node:path"

import tmp from "tmp"

import { FlightDeck, Klaxon } from "../src/lib"

const testDirname = import.meta.dirname

let flightDeck: FlightDeck
let tmpDir: tmp.DirResult

beforeEach(() => {
	vitest.spyOn(console, `error`)
	vitest.spyOn(console, `warn`)
	vitest.spyOn(console, `log`)
	tmpDir = tmp.dirSync({ unsafeCleanup: true })
	tmp.setGracefulCleanup()
})

afterEach(() => {
	flightDeck.stopAllServices()
})

describe(`FlightDeck`, () => {
	it(`should start a service and keep it up to date`, async () => {
		let version = 0
		flightDeck = new FlightDeck({
			secret: `secret`,
			packageName: `my-app`,
			executables: {
				frontend: [`./app`],
			},
			flightdeckRootDir: tmpDir.name,
			get downloadPackageToUpdatesCmd() {
				return [
					`bun`,
					`build`,
					`${testDirname}/fixtures/app@v${version}.ts`,
					`--bundle`,
					`--outfile`,
					`${resolve(tmpDir.name, `update`, `app`)}`,
				]
			},
		})
		await flightDeck.alive
		// list files in the flightdeckRootDir
		console.log({
			root: await readdir(tmpDir.name),
			// current: await readdir(resolve(tmpDir.name, `current`, `app`)),
			currentApp: await readdir(flightDeck.currentServiceDir),
		})
		const data = await fetch(`http://localhost:4444/`)
		console.log(await data.text())

		version++
		const response = await Klaxon.alert({
			secret: `secret`,
			endpoint: `http://localhost:8080/`,
		})
		console.log(response)
		expect(response.status).toBe(200)

		await flightDeck.dead
		await flightDeck.alive
	}, 5000)
})
