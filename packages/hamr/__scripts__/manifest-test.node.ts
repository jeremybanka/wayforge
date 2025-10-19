#!/usr/bin/env node

import defineIntegrationScope from "./define-integration-scope.node.ts"
import definePackageExports from "./define-package-exports.node.ts"

definePackageExports(`test`)
defineIntegrationScope(`test`)
