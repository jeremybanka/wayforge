#!/usr/bin/env node

import { worker } from "./backend.worker.ts"

console.log(`hello world`)

const gameWorker = worker(`backend.worker.game.bun`)

process.on(`exit`, () => gameWorker.process.kill())
