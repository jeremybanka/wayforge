#!/usr/bin/env bun

import { resolve } from "node:path"

import { $ } from "bun"

const applicationRoot = resolve(import.meta.dir, `..`)
const drizzleConfig = resolve(applicationRoot, `drizzle.config.ts`)

await $`bun drizzle-kit studio --config ${drizzleConfig}`
