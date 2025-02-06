import { Ferret } from "../../src/ferret.ts"
import { Squirrel } from "../../src/squirrel.ts"
import { varmintWorkspaceManager } from "../../src/varmint-workspace-manager.ts"

const tempdirName = process.argv[2]

varmintWorkspaceManager.startGlobalTracking()

function asyncRand() {
	return new Promise((resolve) =>
		setTimeout(() => {
			resolve(Math.floor(Math.random() * 100))
		}, 1),
	)
}
const squirrel = new Squirrel(`read-write`, tempdirName)
await squirrel.add(`rand`, asyncRand).for(`my-rand`).get()

const myStreamFunction = () => {
	const myAsyncIterable = {
		async *[Symbol.asyncIterator]() {
			await new Promise((resolve) => setTimeout(resolve, 1))
			yield `chunk1`
			await new Promise((resolve) => setTimeout(resolve, 1))
			yield `chunk2`
			await new Promise((resolve) => setTimeout(resolve, 1))
			yield `chunk3`
		},
	}
	return Promise.resolve(myAsyncIterable)
}
const myFerret = new Ferret(`read-write`, tempdirName)
await myFerret.add(`myStreamer`, myStreamFunction).for(`myAsyncIterable`).get()
