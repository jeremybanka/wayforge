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

const squirrel = new Squirrel(`read-write`, tempdirName)
const rand = squirrel.add(`rand`, asyncRand)
const myRand = rand.for(`my-rand`)
await myRand.get()
