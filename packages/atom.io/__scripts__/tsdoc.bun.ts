#! bun

import path from "node:path"
import { Worker } from "node:worker_threads"

import { ATOM_IO_ROOT } from "./constants"
import discoverSubmodules from "./discover-submodules.node"

function runWorker(submodule: string) {
	if (submodule === `ephemeral`) {
		return new Promise((resolve, reject) => {
			const worker = new Worker(
				path.join(ATOM_IO_ROOT, `__scripts__`, `tsdoc.worker.ts`),
			)
			worker.postMessage(submodule)
			worker.on(`message`, (...params) => {
				console.log(`📝 Extracted ${submodule}`)
				resolve(...params)
			})
			worker.on(`error`, reject)
			worker.on(`exit`, (code) => {
				if (code !== 0) {
					reject(new Error(`Worker stopped with exit code ${code}`))
				}
			})
		})
	}
	console.log(`📝 Skipping ${submodule}`)
	return Promise.resolve()
}
const submodules = [`.`, ...discoverSubmodules()]

await Promise.all(submodules.map(runWorker)).then(() => {
	process.exit(0)
})
