#!/usr/bin/env node

import { resolve } from "node:path"

import { FlightDeck } from "../../src/lib.ts"

const [, , ...args] = process.argv
const [tmpDirName, testDirname] = args

console.log(`process.argv`, process.argv)
console.log(`tmpDirName`, tmpDirName)
console.log(`testDirname`, testDirname)
console.log(`process.pid`, process.pid)

const flightDeck = new FlightDeck({
	port: 9999,
	packageName: `my-app`,
	services: {
		frontend: { run: `./frontend 7777`, waitFor: false },
		backend: { run: `./backend 8888`, waitFor: true },
	},
	flightdeckRootDir: tmpDirName,
	scripts: {
		download: [
			`bun build ${testDirname}/fixtures/app@v0.ts --outfile ${resolve(tmpDirName, `frontend`)}`,
			`&&`,
			`bun build ${testDirname}/fixtures/app@v0.ts --outfile ${resolve(tmpDirName, `backend`)}`,
		].join(` `),
		install: `echo "Hello from the install script!"`,
		checkAvailability: `${testDirname}/fixtures/check-available-version.ts`,
	},
})
await flightDeck.live
process.stdout.write(`flightdeck is live`)
