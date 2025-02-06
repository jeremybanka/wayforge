import { varmintWorkspaceManager } from "../../src/varmint-workspace-manager.ts"

await varmintWorkspaceManager.uploadUnusedFilesToArtifacts()
varmintWorkspaceManager.endGlobalTrackingAndFlushUnusedFiles()
