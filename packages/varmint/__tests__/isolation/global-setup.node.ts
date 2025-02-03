import * as fs from "node:fs"

import { Squirrel } from "../../src/squirrel.ts"
import { varmintWorkspaceManager } from "../../src/varmint-workspace-manager.ts"

const tempdirName = process.argv[2]

function asyncRand() {
	return new Promise((resolve) =>
		setTimeout(() => {
			resolve(Math.floor(Math.random() * 100))
		}, 1),
	)
}

varmintWorkspaceManager.startGlobalTracking()
console.log(varmintWorkspaceManager.storage)
console.log(`tempdirname:`, tempdirName)

console.log(`tempdir contents:`, fs.readdirSync(tempdirName))
const squirrel = new Squirrel(`read-write`, tempdirName)
console.log(`tempdir contents:`, fs.readdirSync(tempdirName))
const rand = squirrel.add(`rand`, asyncRand)
console.log(`tempdir contents:`, fs.readdirSync(tempdirName))
const myRand = rand.for(`my-rand`)
console.log(`tempdir contents:`, fs.readdirSync(tempdirName))
await myRand.get()
console.log(`tempdir contents:`, fs.readdirSync(tempdirName))
