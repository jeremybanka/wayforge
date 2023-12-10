import defineIntegrationScope from "./define-integration-scope.node"
import definePackageExports from "./define-package-exports.node"
import defineSubmoduleManifests from "./define-submodule-manifests.node"

definePackageExports(`test`)
defineIntegrationScope(`test`)
defineSubmoduleManifests(`test`)
