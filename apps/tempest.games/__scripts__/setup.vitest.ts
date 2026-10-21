import { execSync } from "node:child_process"
import { resolve } from "node:path"

export default (): void => {
	execSync(resolve(import.meta.dirname, `setup-db.node.ts`), {
		stdio: `inherit`,
	})
}
