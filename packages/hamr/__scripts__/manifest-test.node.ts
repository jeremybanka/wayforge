#!/usr/bin/env node

import defineIntegrationScope from "./define-integration-scope.node"
import definePackageExports from "./define-package-exports.node"

definePackageExports(`test`)
defineIntegrationScope(`test`)
