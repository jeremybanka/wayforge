#!/usr/bin/env bun

import path from "node:path"
import { Worker } from "node:worker_threads"

import discoverSubmodules from "~/packages/atom.io/__scripts__/discover-submodules.node"

import { ATOM_IO_FYI_ROOT } from "./constants"

function runWorker(submodule: string) {
	if (submodule === `.`) {
		return new Promise((resolve, reject) => {
			const worker = new Worker(
				path.join(ATOM_IO_FYI_ROOT, `scripts`, `tsdoc.bun.worker.ts`),
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
