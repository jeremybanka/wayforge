#!/usr/bin/env bun

import * as path from "node:path"

import { $ } from "bun"

const localHostName = (await $`scutil --get LocalHostName`).text().trim()

const bonjourName = `${localHostName}.local`

console.log(`setting up a fake certificate for ${bonjourName}`)

const scriptDir = import.meta.dir

const certDir = path.join(scriptDir, `../dev`)

process.chdir(certDir)

await $`mkcert -install`

const rootCertDir = await $`mkcert -CAROOT`

await $`open "${rootCertDir.text().trim()}"`

await $`mkcert ${bonjourName}`

await $`open "${rootCertDir.text().trim()}"`
