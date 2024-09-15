import { error } from "node:console"
import type { IncomingHttpHeaders, IncomingHttpStatusHeader } from "node:http2"
import { connect } from "node:http2"
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
	flightDeck.stopService()
})

describe(`FlightDeck`, () => {
	it(`should start a service and keep it up to date`, async () => {
		let version = 0
		flightDeck = new FlightDeck({
			secret: `secret`,
			repo: `sample/repo`,
			app: `my-app`,
			runCmd: [`./app`],
			serviceDir: tmpDir.name,
			get updateCmd() {
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
		const data = await fetch(`http://localhost:4444/`)
		console.log(await data.text())

		version++
		const response = await Klaxon.alert({
			secret: `secret`,
			endpoint: `http://localhost:8080/`,
		})
		console.log(response)
		if (`error` in response) {
			throw new Error(response.error.join(`\n`))
		}
		expect(response.headers[`:status`]).toBe(200)

		await flightDeck.dead
		await flightDeck.alive
	}, 5000)
})
