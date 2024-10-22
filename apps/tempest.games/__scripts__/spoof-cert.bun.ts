#!/usr/bin/env bun

import { $ } from "bun"

await $`openssl req -x509 -newkey rsa:4096 -keyout dev/key.pem -out dev/cert.pem -days 365 -nodes -subj "/CN=localhost"`
