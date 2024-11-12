#!/usr/bin/env bun

import { resolve } from "node:path"

const version = process.argv.at(-1)

export const v1Exists = await Bun.file(
	resolve(import.meta.dir, `app@v${version}.ts`),
).exists()

if (v1Exists) process.exit(0)

process.exit(1)
