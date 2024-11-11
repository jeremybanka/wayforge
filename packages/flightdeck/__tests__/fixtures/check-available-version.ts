#!/usr/bin/env bun

console.log(process.argv)

export const v1Exists = await Bun.file(`./app@v1.ts`).exists()

if (v1Exists) process.exit(0)

process.exit(1)
