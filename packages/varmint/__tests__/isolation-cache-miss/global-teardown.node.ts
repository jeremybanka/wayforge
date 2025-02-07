import { varmintWorkspaceManager } from "../../src/varmint-workspace-manager.ts"

await varmintWorkspaceManager.prepareUploads()
varmintWorkspaceManager.endGlobalTrackingAndFlushUnusedFiles()
