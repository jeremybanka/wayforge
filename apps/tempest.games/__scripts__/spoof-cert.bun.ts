#!/usr/bin/env bun

import * as os from "node:os"
import * as path from "node:path"

import { $ } from "bun"

const scriptDir = import.meta.dir

const certDir = path.join(scriptDir, `../dev`)

process.chdir(certDir)

await $`mkcert -install`

const rootCertDir = await $`mkcert -CAROOT`

await $`open "${rootCertDir.text().trim()}"`

await $`mkcert ${os.hostname()}`

await $`open "${rootCertDir.text().trim()}"`
