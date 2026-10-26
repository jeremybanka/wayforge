import { changesetsReleaseDelta } from "@breakage/changesets"
import { defineConfig, semverPolicy, type BreakageConfig } from "breakage"

const config: BreakageConfig = defineConfig({
	tagPattern: "refs/tags/comline@",
	testPattern: "__tests__/{public,fixtures}/**/!(shell-completion.bun.ts)",
	test: "pnpm test:public",
	release: {
		resolveDelta: changesetsReleaseDelta(),
		policy: semverPolicy({ beforeV1: "minor" }),
	},
})

export default config
