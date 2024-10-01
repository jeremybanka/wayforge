import { execSync } from "node:child_process"

export default (): void => void execSync(`./__scripts__/setup-db.bun.ts`)
