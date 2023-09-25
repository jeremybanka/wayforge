import tsconfigPaths from "vite-tsconfig-paths"
describe(`config resolution`, () => {
	test(`paths`, async () => {
		const project = `./tsconfig.json`
		const tsconfigPathsPlugin = tsconfigPaths({
			projects: [project],
		})
	})
})
