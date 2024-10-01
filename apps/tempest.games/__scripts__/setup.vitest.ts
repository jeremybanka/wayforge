import { execSync } from "node:child_process"
import { resolve } from "node:path"

export default (): void =>
	void execSync(resolve(__dirname, `../__scripts__/setup-db.bun.ts`), {
		env: {
			...process.env,
		},
	})
