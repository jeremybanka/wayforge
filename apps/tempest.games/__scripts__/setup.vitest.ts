import { execSync } from "node:child_process"

export default (): void => {
	execSync(`pnpm db:up`)
}
