#!/usr/bin/env node

import defineIntegrationScope from "./define-integration-scope.ts"
import definePackageExports from "./define-package-exports.ts"

definePackageExports(`make`)
defineIntegrationScope(`make`)
