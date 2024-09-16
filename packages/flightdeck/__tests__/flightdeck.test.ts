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
				frontend: [`./frontend`, `7777`],
				backend: [`./backend`, `8888`],
			},
			flightdeckRootDir: tmpDir.name,
			get downloadPackageToUpdatesCmd() {
				return [
					`bun`,
					`build`,
					`${testDirname}/fixtures/app@v${version}.ts`,
					`--bundle`,
					`--outfile`,
					`${resolve(tmpDir.name, `my-app`, `update`, `frontend`)}`,
					`&&`,
					`bun`,
					`build`,
					`${testDirname}/fixtures/app@v${version}.ts`,
					`--bundle`,
					`--outfile`,
					`${resolve(tmpDir.name, `my-app`, `update`, `backend`)}`,
				]
			},
		})
		await flightDeck.alive
		const data = await fetch(`http://localhost:7777/`)
		console.log(await data.text())
		const data0 = await fetch(`http://localhost:8888/`)
		console.log(await data0.text())

		version++
		const response = await Klaxon.alert({
			secret: `secret`,
			endpoint: `http://localhost:8080/`,
		})
		console.log(response)
		expect(response.status).toBe(200)

		await flightDeck.dead
		console.log(`👷 FlightDeck is dead`)
		await flightDeck.alive
		console.log(`👷 FlightDeck is alive`)
	}, 5000)
})
